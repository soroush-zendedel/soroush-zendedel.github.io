import { createServer } from "node:http";
import { execFile as execFileCallback } from "node:child_process";
import { readFile, readdir, rename, unlink, writeFile } from "node:fs/promises";
import { promisify } from "node:util";
import { dirname, extname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes, timingSafeEqual } from "node:crypto";

const execFile = promisify(execFileCallback);
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const projectFile = join(root, "content", "projects.json");
const profileFile = join(root, "content", "profile.json");
const socialFile = join(root, "content", "social.json");
const blogFile = join(root, "content", "blog.json");
const port = Number(process.env.PORT || 8082);
const token = randomBytes(24).toString("hex");
const generatedFiles = ["index.html", "en/index.html", "about.html", "en/about.html", "projects.html", "en/projects.html"];
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

async function getEditorSession(base) {
  if (typeof base !== "string" || !/^[0-9a-f]{40,64}$/i.test(base)) {
    throw new Error("Editing session is missing or invalid. Start a new edit session.");
  }
  try {
    await runGit(["merge-base", "--is-ancestor", base, "HEAD"]);
  } catch {
    throw new Error("The current branch no longer contains the start of this editing session.");
  }
  const { stdout } = await runGit(["rev-list", "--reverse", `${base}..HEAD`]);
  const commits = stdout.trim() ? stdout.trim().split(/\r?\n/) : [];
  const allowedFiles = new Set(["content/projects.json", "content/profile.json", "content/social.json", "content/blog.json", ...generatedFiles]);
  for (const commit of commits) {
    const [{ stdout: subject }, { stdout: changedFiles }] = await Promise.all([
      runGit(["show", "-s", "--format=%s", commit]),
      runGit(["diff-tree", "--no-commit-id", "--name-only", "-r", commit]),
    ]);
    const { stdout: remoteRefs } = await runGit(["branch", "--remotes", "--contains", commit]);
    const files = changedFiles.trim().split(/\r?\n/).filter(Boolean);
    if (remoteRefs.trim()) throw new Error("This session contains a commit already pushed to a remote; nothing was undone.");
    if (!subject.startsWith("content:") || !files.length || files.some((file) =>
      !allowedFiles.has(file) && !/^img\/[a-z0-9-]+(?:-v\d+)?\.(?:webp|jpg|jpeg|png)$/i.test(file)
    )) {
      throw new Error("This session includes commits outside the project editor; nothing was undone.");
    }
  }
  return commits;
}

async function handleEditSession(request, response) {
  if (!isAuthorized(request)) return send(response, 403, { error: "Editor request rejected." });
  if (saving) return send(response, 409, { error: "Another edit is being saved." });
  saving = true;
  try {
    const payload = await readBody(request);
    if (payload.action === "start") {
      await requireCleanWorkingTree();
      const { stdout } = await runGit(["rev-parse", "HEAD"]);
      return send(response, 200, { base: stdout.trim(), count: 0 });
    }
    const commits = await getEditorSession(payload.base);
    if (payload.action === "status") return send(response, 200, { base: payload.base, count: commits.length });
    if (payload.action !== "undo") return send(response, 400, { error: "Unsupported session action." });
    await requireCleanWorkingTree();
    if (!commits.length) return send(response, 200, { unchanged: true, count: 0 });
    await runGit(["reset", "--hard", payload.base]);
    return send(response, 200, { undone: commits.length });
  } catch (error) {
    return send(response, 409, { error: error.message || "Could not update the edit session." });
  } finally {
    saving = false;
  }
}

async function readBody(request) {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 7_000_000) throw new Error("Request is too large. Images must be 5 MB or smaller.");
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

function isLocalHost(request) {
  return request.headers.host === `localhost:${port}` || request.headers.host === `127.0.0.1:${port}`;
}

function isSafeProfileUrl(value, allowRelative = false) {
  if (typeof value !== "string" || !value || value.length > 2_000 || /[\u0000-\u0020\\]/.test(value)) return false;
  if (allowRelative && /^(?:\.\.?\/|\/)[^/\\]/.test(value)) return true;
  try {
    const parsed = new URL(value);
    return ["http:", "https:", "mailto:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

async function saveChange(request, response) {
  if (!isAuthorized(request)) return send(response, 403, { error: "Editor request rejected." });
  if (saving) return send(response, 409, { error: "Another edit is being saved." });
  saving = true;

  let originalJson;
  let contentFile = projectFile;
  let dataToWrite;
  let staged = false;
  let uploadedFile;
  let uploadedFileCreated = false;
  const archivedImages = [];
  try {
    await requireCleanWorkingTree();
    const payload = await readBody(request);
    const projects = JSON.parse(await readFile(projectFile, "utf8"));
    originalJson = JSON.stringify(projects, null, 2) + "\n";
    dataToWrite = projects;
    let message;

    if (payload.type === "updateProfile") {
      const profile = JSON.parse(await readFile(profileFile, "utf8"));
      const field = typeof payload.field === "string" ? payload.field : "";
      const value = typeof payload.value === "string" ? payload.value.trim().replace(/\s+/g, " ") : null;
      const match = field.match(/^profile\.([a-zA-Z0-9]+)\.(fa|en)$/);
      const isAlt = field === "profile.avatar.alt";
      if ((!match && !isAlt) || value === null) return send(response, 400, { error: "Unsupported profile field." });
      const target = isAlt ? profile.avatar : profile.fields[match[1]];
      const key = isAlt ? "alt" : match[2];
      const maxLength = isAlt ? 300 : match[1] === "bio" ? 1200 : 500;
      if (!target || value.length > maxLength || !value) return send(response, 400, { error: "Profile text must be non-empty and within its character limit." });
      if (target[key] === value) return send(response, 200, { unchanged: true });
      originalJson = JSON.stringify(profile, null, 2) + "\n";
      contentFile = profileFile;
      dataToWrite = profile;
      target[key] = value;
      message = `content: update profile ${isAlt ? "image alt" : `${match[1]} ${match[2]}`}`;
    } else if (payload.type === "updateProfileLink") {
      const profile = JSON.parse(await readFile(profileFile, "utf8"));
      if (!["contact", "projects"].includes(payload.key) || !isSafeProfileUrl(payload.value, payload.key === "projects")) {
        return send(response, 400, { error: "Enter a safe http, https, mailto, or relative page link." });
      }
      if (profile.links[payload.key] === payload.value.trim()) return send(response, 200, { unchanged: true });
      originalJson = JSON.stringify(profile, null, 2) + "\n";
      contentFile = profileFile;
      dataToWrite = profile;
      profile.links[payload.key] = payload.value.trim();
      message = `content: update profile link ${payload.key}`;
    } else if (payload.type === "saveSocials") {
      const socialData = JSON.parse(await readFile(socialFile, "utf8"));
      if (!Array.isArray(payload.socials) || payload.socials.length > 30) {
        return send(response, 400, { error: "Add up to 30 social links." });
      }
      const ids = new Set();
      for (const item of payload.socials) {
        if (!item || typeof item.id !== "string" || item.id.length > 80 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.id) || ids.has(item.id)) {
          return send(response, 400, { error: "Social link IDs must be unique English slugs." });
        }
        ids.add(item.id);
        for (const language of ["fa", "en"]) {
          if (typeof item[language] !== "string" || !item[language].trim() || item[language].trim().length > 100) {
            return send(response, 400, { error: "Each social link needs Persian and English text under 100 characters." });
          }
        }
        if (!isSafeProfileUrl(item.href)) return send(response, 400, { error: "Social links must use a safe http, https, or mailto URL." });
      }
      const socials = payload.socials.map((item) => ({ id: item.id, fa: item.fa.trim(), en: item.en.trim(), href: item.href.trim() }));
      if (JSON.stringify(socialData.socials) === JSON.stringify(socials)) return send(response, 200, { unchanged: true });
      originalJson = JSON.stringify(socialData, null, 2) + "\n";
      contentFile = socialFile;
      dataToWrite = socialData;
      socialData.socials = socials;
      message = "content: update social links";
    } else if (payload.type === "saveBlog") {
      const currentBlog = JSON.parse(await readFile(blogFile, "utf8"));
      const href = typeof payload.blog?.href === "string" ? payload.blog.href.trim() : "";
      const icon = payload.blog?.icon;
      if (!isSafeProfileUrl(href)) return send(response, 400, { error: "Enter a safe http, https, or mailto blog URL." });
      if (!["book", "pen", "page"].includes(icon)) return send(response, 400, { error: "Choose one of the available blog icons." });
      const fields = {};
      for (const key of ["title", "subtitle", "description", "button"]) {
        fields[key] = {};
        for (const language of ["fa", "en"]) {
          const value = typeof payload.blog?.fields?.[key]?.[language] === "string"
            ? payload.blog.fields[key][language].trim().replace(/\s+/g, " ")
            : "";
          const maxLength = key === "description" ? 500 : key === "subtitle" ? 300 : 200;
          if (!value || value.length > maxLength) {
            return send(response, 400, { error: `Complete both language versions of the blog ${key} (up to ${maxLength} characters).` });
          }
          fields[key][language] = value;
        }
      }
      const updatedBlog = { href, icon, fields };
      if (JSON.stringify(currentBlog) === JSON.stringify(updatedBlog)) return send(response, 200, { unchanged: true });
      originalJson = JSON.stringify(currentBlog, null, 2) + "\n";
      contentFile = blogFile;
      dataToWrite = updatedBlog;
      message = "content: update blog card";
    } else if (payload.type === "addProject") {
      const projectId = typeof payload.id === "string" ? payload.id.trim() : "";
      const faName = typeof payload.faName === "string" ? payload.faName.trim().replace(/\s+/g, " ") : "";
      const enName = typeof payload.enName === "string" ? payload.enName.trim().replace(/\s+/g, " ") : "";
      const faDescription = typeof payload.faDescription === "string" ? payload.faDescription.trim().replace(/\s+/g, " ") : "";
      const enDescription = typeof payload.enDescription === "string" ? payload.enDescription.trim().replace(/\s+/g, " ") : "";
      const alt = typeof payload.alt === "string" ? payload.alt.trim().replace(/\s+/g, " ") : "";
      const href = typeof payload.href === "string" ? payload.href.trim() : "";
      const reservedId = /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(projectId);
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(projectId) || projectId.length > 80 || reservedId || projects.some((project) => project.id === projectId)) {
        return send(response, 400, { error: "Project ID must be a unique English slug (for example, my-project)." });
      }
      if (!faName || !enName || !faDescription || !enDescription || faName.length > 200 || enName.length > 200 || faDescription.length > 300 || enDescription.length > 300 || alt.length > 300) {
        return send(response, 400, { error: "Add both project names and descriptions (up to 300 characters)." });
      }
      let parsedHref;
      try { parsedHref = new URL(href); } catch { return send(response, 400, { error: "Enter a complete http or https project URL." }); }
      if (!["http:", "https:"].includes(parsedHref.protocol) || href.length > 2_000) {
        return send(response, 400, { error: "Enter a complete http or https project URL under 2,000 characters." });
      }
      const extensions = { "image/webp": "webp", "image/jpeg": "jpg", "image/png": "png" };
      const extension = extensions[payload.mime];
      if (!extension || typeof payload.data !== "string") return send(response, 400, { error: "Choose a WebP, JPEG, or PNG project image." });
      const imageBytes = Buffer.from(payload.data, "base64");
      if (!imageBytes.length || imageBytes.length > 5 * 1024 * 1024 || imageBytes.toString("base64") !== payload.data) {
        return send(response, 400, { error: "Image must be valid and 5 MB or smaller." });
      }
      const validImage = extension === "webp"
        ? imageBytes.length > 12 && imageBytes.toString("ascii", 0, 4) === "RIFF" && imageBytes.toString("ascii", 8, 12) === "WEBP"
        : extension === "jpg"
          ? imageBytes[0] === 0xff && imageBytes[1] === 0xd8 && imageBytes.at(-2) === 0xff && imageBytes.at(-1) === 0xd9
          : imageBytes.length > 8 && imageBytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
      if (!validImage) return send(response, 400, { error: "The file contents do not match the selected image type." });
      const imageNames = await readdir(join(root, "img"));
      const image = `${projectId}.${extension}`;
      if (imageNames.includes(image)) return send(response, 409, { error: `The image file img/${image} already exists; choose another project ID.` });
      const fallback = enName.split(/\s+/).slice(0, 3).map((word) => word[0]).join("").toUpperCase() || projectId.slice(0, 2).toUpperCase();
      const nameOrder = Math.max(0, ...projects.map((project) => project.order)) + 1;
      projects.push({
        id: projectId,
        order: nameOrder,
        visible: true,
        href,
        image,
        imageFallback: fallback,
        home: {
          fa: { name: faName, description: faDescription },
          en: { name: enName, description: enDescription },
          alt,
        },
        about: {
          fa: { name: faName, description: faDescription },
          en: { name: enName, description: enDescription },
        },
      });
      uploadedFile = join(root, "img", image);
      await writeFile(uploadedFile, imageBytes, { flag: "wx" });
      uploadedFileCreated = true;
      message = `content: add ${projectId} project`;
    } else if (payload.type === "update") {
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
    } else if (payload.type === "updateHref") {
      if (typeof payload.projectId !== "string" || typeof payload.value !== "string") {
        return send(response, 400, { error: "Invalid project link." });
      }
      const project = projects.find((item) => item.id === payload.projectId);
      if (!project) return send(response, 404, { error: "Project not found." });
      const value = payload.value.trim();
      let parsed;
      try { parsed = new URL(value); } catch { return send(response, 400, { error: "Enter a complete http or https URL." }); }
      if (!["http:", "https:"].includes(parsed.protocol) || value.length > 2_000) {
        return send(response, 400, { error: "Enter a complete http or https URL under 2,000 characters." });
      }
      if (project.href === value) return send(response, 200, { unchanged: true });
      project.href = value;
      message = `content: update ${project.id} link`;
    } else if (payload.type === "uploadImage" || payload.type === "uploadProfileImage") {
      const isProfileImage = payload.type === "uploadProfileImage";
      if (typeof payload.projectId !== "string" || typeof payload.mime !== "string" || typeof payload.data !== "string") {
        return send(response, 400, { error: "Invalid image upload." });
      }
      let profile;
      let project;
      if (isProfileImage) {
        profile = JSON.parse(await readFile(profileFile, "utf8"));
        originalJson = JSON.stringify(profile, null, 2) + "\n";
        if (typeof payload.alt === "string") {
          const alt = payload.alt.trim().replace(/\s+/g, " ");
          if (!alt || alt.length > 300) return send(response, 400, { error: "Image alt text must be non-empty and under 300 characters." });
          profile.avatar.alt = alt;
        }
        contentFile = profileFile;
        dataToWrite = profile;
        project = { id: "me", image: profile.avatar.image };
      } else {
        project = projects.find((item) => item.id === payload.projectId);
        if (!project) return send(response, 404, { error: "Project not found." });
      }
      const extensions = { "image/webp": "webp", "image/jpeg": "jpg", "image/png": "png" };
      const extension = extensions[payload.mime];
      if (!extension) return send(response, 400, { error: "Use a WebP, JPEG, or PNG image." });
      const imageBytes = Buffer.from(payload.data, "base64");
      if (!imageBytes.length || imageBytes.length > 5 * 1024 * 1024 || imageBytes.toString("base64") !== payload.data) {
        return send(response, 400, { error: "Image must be valid and 5 MB or smaller." });
      }
      const validImage = extension === "webp"
        ? imageBytes.length > 12 && imageBytes.toString("ascii", 0, 4) === "RIFF" && imageBytes.toString("ascii", 8, 12) === "WEBP"
        : extension === "jpg"
          ? imageBytes[0] === 0xff && imageBytes[1] === 0xd8 && imageBytes.at(-2) === 0xff && imageBytes.at(-1) === 0xd9
          : imageBytes.length > 8 && imageBytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
      if (!validImage) return send(response, 400, { error: "The file contents do not match the selected image type." });
      const imageDirectory = join(root, "img");
      const imageNames = await readdir(imageDirectory);
      if (!/^[a-z0-9-]+$/.test(project.id)) return send(response, 400, { error: "This project has an unsupported id." });
      if (!/^[a-zA-Z0-9_-]+\.(?:webp|jpe?g|png)$/i.test(project.image) || !imageNames.includes(project.image)) {
        return send(response, 400, { error: "The current project image could not be archived safely." });
      }
      const imageNameSet = new Set(imageNames);
      let nextArchiveVersion = imageNames.reduce((max, name) => {
        const match = name.match(new RegExp(`^${project.id}-v(\\d+)\\.(?:webp|jpg|jpeg|png)$`, "i"));
        return Math.max(max, Number(match?.[1] || 0));
      }, 0);
      const archiveImage = async (filename) => {
        const oldExtension = extname(filename).slice(1).toLowerCase();
        let archiveName;
        do {
          archiveName = `${project.id}-v${++nextArchiveVersion}.${oldExtension}`;
        } while (imageNameSet.has(archiveName));
        const from = join(imageDirectory, filename);
        const to = join(imageDirectory, archiveName);
        await rename(from, to);
        imageNameSet.delete(filename);
        imageNameSet.add(archiveName);
        archivedImages.push({ from, to, filename, archiveName });
      };
      const filename = `${project.id}.${extension}`;
      const previousImage = project.image;
      if (previousImage !== filename) await archiveImage(previousImage);
      if (imageNameSet.has(filename)) await archiveImage(filename);
      uploadedFile = join(imageDirectory, filename);
      await writeFile(uploadedFile, imageBytes, { flag: "wx" });
      uploadedFileCreated = true;
      project.image = filename;
      if (isProfileImage) profile.avatar.image = filename;
      message = `content: replace ${project.id} image`;
    } else if (payload.type === "reorder") {
      if (!Array.isArray(payload.projectIds) || payload.projectIds.length > projects.length || payload.projectIds.some((id) => typeof id !== "string")) {
        return send(response, 400, { error: "Invalid project order." });
      }
      const visible = projects.filter((project) => project.visible).sort((a, b) => a.order - b.order);
      const visibleIds = visible.map((project) => project.id);
      const priorityIds = visible.slice(0, 6).map((project) => project.id);
      const validIds = (expected) => payload.projectIds.length === expected.length && new Set(payload.projectIds).size === expected.length && payload.projectIds.every((id) => expected.includes(id));
      const fullOrder = validIds(visibleIds);
      const priorityOrder = validIds(priorityIds);
      if (!fullOrder && !priorityOrder) {
        return send(response, 400, { error: "Reorder either all visible projects or the six highest-priority projects." });
      }
      const allProjects = [...projects].sort((a, b) => a.order - b.order);
      const slots = allProjects.map((project) => project.visible);
      const nextVisible = fullOrder
        ? payload.projectIds.map((id) => projects.find((project) => project.id === id))
        : [...payload.projectIds.map((id) => projects.find((project) => project.id === id)), ...visible.slice(6)];
      let visibleIndex = 0;
      const nextProjects = allProjects.map((project, index) => slots[index] ? nextVisible[visibleIndex++] : project);
      nextProjects.forEach((project, index) => { project.order = index + 1; });
      projects.splice(0, projects.length, ...nextProjects);
      const comparedIds = fullOrder ? visibleIds : priorityIds;
      if (payload.projectIds.every((id, index) => id === comparedIds[index])) {
        return send(response, 200, { unchanged: true });
      }
      message = "content: reorder projects";
    } else {
      return send(response, 400, { error: "Unsupported editor action." });
    }

    const temporaryFile = `${contentFile}.tmp`;
    await writeFile(temporaryFile, JSON.stringify(dataToWrite, null, 2) + "\n", "utf8");
    await rename(temporaryFile, contentFile);
    await execFile(process.execPath, [join(root, "scripts", "build-site.mjs")], { cwd: root, windowsHide: true });
    const imagePaths = [...archivedImages.map(({ filename, archiveName }) => [`img/${filename}`, `img/${archiveName}`]).flat(), ...(uploadedFile ? [`img/${uploadedFile.split(sep).at(-1)}`] : [])];
    const changedPaths = [relative(root, contentFile).split(sep).join("/"), ...generatedFiles, ...imagePaths];
    await runGit(["add", "--", ...changedPaths]);
    staged = true;
    const { stdout } = await runGit(["commit", "-m", message]);
    const commit = stdout.match(/\[[^\]]+\s+([0-9a-f]+)\]/)?.[1] || "committed";
    send(response, 200, { commit, message });
  } catch (error) {
    if (staged) {
      const imagePaths = [...archivedImages.map(({ filename, archiveName }) => [`img/${filename}`, `img/${archiveName}`]).flat(), ...(uploadedFile ? [`img/${uploadedFile.split(sep).at(-1)}`] : [])];
      try { await runGit(["reset", "--", relative(root, contentFile).split(sep).join("/"), ...generatedFiles, ...imagePaths]); } catch {}
    }
    if (originalJson) {
      try {
        await writeFile(contentFile, originalJson, "utf8");
        await execFile(process.execPath, [join(root, "scripts", "build-site.mjs")], { cwd: root, windowsHide: true });
      } catch (rollbackError) {
        console.error("Editor rollback failed:", rollbackError);
      }
    }
    if (uploadedFile) {
      if (uploadedFileCreated) {
        try { await unlink(uploadedFile); } catch {}
      }
    }
    for (const image of archivedImages.toReversed()) {
      try { await rename(image.to, image.from); } catch {}
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
  if (!isLocalHost(request)) return send(response, 403, "Local preview only", "text/plain; charset=utf-8");
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
  if (url.pathname === "/__dev/session" && request.method === "POST") return handleEditSession(request, response);
  if (request.method !== "GET" && request.method !== "HEAD") return send(response, 405, "Method not allowed", "text/plain; charset=utf-8");
  return serveFile(request, response, url.pathname);
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Development preview with editor: http://localhost:${port}/`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
