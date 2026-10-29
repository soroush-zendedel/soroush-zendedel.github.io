import { createServer } from "node:http";
import { execFile as execFileCallback } from "node:child_process";
import { readFile, rename, writeFile } from "node:fs/promises";
import { promisify } from "node:util";
import { dirname, extname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes, timingSafeEqual } from "node:crypto";

const execFile = promisify(execFileCallback);
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const projectFile = join(root, "content", "projects.json");
const port = Number(process.env.PORT || 8082);
const token = randomBytes(24).toString("hex");
const generatedFiles = ["index.html", "en/index.html", "about.html", "en/about.html"];
const editableFields = new Set([
  "home.fa.name", "home.fa.description", "home.en.name", "home.en.description",
  "about.fa.name", "about.fa.description", "about.en.name", "about.en.description",
]);
const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
};

let saving = false;

function send(response, status, body, type = "application/json; charset=utf-8") {
  response.writeHead(status, { "content-type": type, "cache-control": "no-store", "x-content-type-options": "nosniff" });
  response.end(type.startsWith("application/json") ? JSON.stringify(body) : body);
}

async function runGit(args) {
  return execFile("git", args, { cwd: root, windowsHide: true, maxBuffer: 1024 * 1024 });
}

async function requireCleanWorkingTree() {
  const { stdout } = await runGit(["status", "--porcelain"]);
  if (stdout.trim()) throw new Error("Working tree is not clean. Commit or discard other changes before using the editor.");
}

async function readBody(request) {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 8_192) throw new Error("Request is too large.");
  }
  return JSON.parse(body);
}

function isAuthorized(request) {
  const origin = request.headers.origin;
  const host = request.headers.host;
  const allowedOrigin = origin === `http://localhost:${port}` || origin === `http://127.0.0.1:${port}`;
  const allowedHost = host === `localhost:${port}` || host === `127.0.0.1:${port}`;
  const supplied = Buffer.from(String(request.headers["x-editor-token"] || ""));
  const expected = Buffer.from(token);
  return allowedOrigin && allowedHost && supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

async function saveChange(request, response) {
  if (!isAuthorized(request)) return send(response, 403, { error: "Editor request rejected." });
  if (saving) return send(response, 409, { error: "Another edit is being saved." });
  saving = true;

  let originalJson;
  let staged = false;
  try {
    await requireCleanWorkingTree();
    const payload = await readBody(request);
    const projects = JSON.parse(await readFile(projectFile, "utf8"));
    originalJson = JSON.stringify(projects, null, 2) + "\n";
    let message;

    if (payload.type === "update") {
      if (typeof payload.projectId !== "string" || !editableFields.has(payload.field) || typeof payload.value !== "string") {
        return send(response, 400, { error: "Unsupported project field." });
      }
      const value = payload.value.trim().replace(/\s+/g, " ");
      if (value.length > 300 || (!value && payload.field.endsWith(".name"))) {
        return send(response, 400, { error: "Text must be under 300 characters; names cannot be empty." });
      }
      const project = projects.find((item) => item.id === payload.projectId);
      if (!project) return send(response, 404, { error: "Project not found." });
      const [section, language, key] = payload.field.split(".");
      if (project[section][language][key] === value) return send(response, 200, { unchanged: true });
      project[section][language][key] = value;
      message = `content: update ${project.id} ${language} ${key}`;
    } else if (payload.type === "reorder") {
      if (!Array.isArray(payload.projectIds) || payload.projectIds.length > projects.length || payload.projectIds.some((id) => typeof id !== "string")) {
        return send(response, 400, { error: "Invalid project order." });
      }
      const visible = projects.filter((project) => project.visible).sort((a, b) => a.order - b.order);
      const visibleIds = visible.map((project) => project.id);
      if (payload.projectIds.length !== visibleIds.length || new Set(payload.projectIds).size !== visibleIds.length || payload.projectIds.some((id) => !visibleIds.includes(id))) {
        return send(response, 400, { error: "The order must contain every visible project once." });
      }
      const allProjects = [...projects].sort((a, b) => a.order - b.order);
      const slots = allProjects.map((project) => project.visible);
      const nextVisible = payload.projectIds.map((id) => projects.find((project) => project.id === id));
      let visibleIndex = 0;
      const nextProjects = allProjects.map((project, index) => slots[index] ? nextVisible[visibleIndex++] : project);
      nextProjects.forEach((project, index) => { project.order = index + 1; });
      projects.splice(0, projects.length, ...nextProjects);
      if (payload.projectIds.every((id, index) => id === visibleIds[index])) {
        return send(response, 200, { unchanged: true });
      }
      message = "content: reorder projects";
    } else {
      return send(response, 400, { error: "Unsupported editor action." });
    }

    const temporaryFile = `${projectFile}.tmp`;
    await writeFile(temporaryFile, JSON.stringify(projects, null, 2) + "\n", "utf8");
    await rename(temporaryFile, projectFile);
    await execFile(process.execPath, [join(root, "scripts", "build-site.mjs")], { cwd: root, windowsHide: true });
    await runGit(["add", "--", "content/projects.json", ...generatedFiles]);
    staged = true;
    const { stdout } = await runGit(["commit", "-m", message]);
    const commit = stdout.match(/\[[^\]]+\s+([0-9a-f]+)\]/)?.[1] || "committed";
    send(response, 200, { commit, message });
  } catch (error) {
    if (staged) {
      try { await runGit(["reset", "--", "content/projects.json", ...generatedFiles]); } catch {}
    }
    if (originalJson) {
      try {
        await writeFile(projectFile, originalJson, "utf8");
        await execFile(process.execPath, [join(root, "scripts", "build-site.mjs")], { cwd: root, windowsHide: true });
      } catch (rollbackError) {
        console.error("Editor rollback failed:", rollbackError);
      }
    }
    send(response, 500, { error: error.message || "Could not save the edit." });
  } finally {
    saving = false;
  }
}

async function serveFile(request, response, pathname) {
  let decodedPath;
  try { decodedPath = decodeURIComponent(pathname); } catch { return send(response, 400, "Bad path", "text/plain; charset=utf-8"); }
  const requested = decodedPath.endsWith("/") ? `${decodedPath}index.html` : decodedPath;
  const target = resolve(root, `.${requested}`);
  const rel = relative(root, target);
  if (rel.startsWith(`..${sep}`) || rel === "..") return send(response, 403, "Forbidden", "text/plain; charset=utf-8");

  try {
    let body = await readFile(target);
    const type = mimeTypes[extname(target).toLowerCase()] || "application/octet-stream";
    if (type.startsWith("text/html")) {
      const html = body.toString("utf8").replace("</body>", '<script src="/__dev/editor.js" defer></script></body>');
      body = Buffer.from(html.replace("/__dev/editor.js", `/__dev/editor.js?token=${token}`));
    }
    response.writeHead(200, { "content-type": type, "cache-control": "no-store", "x-content-type-options": "nosniff" });
    if (request.method === "HEAD") response.end();
    else response.end(body);
  } catch (error) {
    send(response, error.code === "ENOENT" ? 404 : 500, error.code === "ENOENT" ? "Not found" : "Could not read file", "text/plain; charset=utf-8");
  }
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url || "/", `http://${request.headers.host || `localhost:${port}`}`);
  if (url.pathname === "/__dev/editor.js" && request.method === "GET") {
    try {
      const source = await readFile(join(root, "scripts", "dev-editor.js"), "utf8");
      return send(response, 200, source.replaceAll("__EDITOR_TOKEN__", token), "text/javascript; charset=utf-8");
    } catch (error) {
      return send(response, 500, { error: error.message });
    }
  }
  if (url.pathname === "/__dev/save" && request.method === "POST") return saveChange(request, response);
  if (request.method !== "GET" && request.method !== "HEAD") return send(response, 405, "Method not allowed", "text/plain; charset=utf-8");
  return serveFile(request, response, url.pathname);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Development preview with editor: http://localhost:${port}/`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
