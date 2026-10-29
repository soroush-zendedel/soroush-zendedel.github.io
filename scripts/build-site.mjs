import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const projects = JSON.parse(await readFile(join(root, "content/projects.json"), "utf8"));

function validateProjects(items) {
  const ids = new Set();
  const orders = new Set();
  for (const project of items) {
    if (!project.id || ids.has(project.id)) throw new Error(`Project id is missing or duplicated: ${project.id}`);
    if (typeof project.visible !== "boolean") throw new Error(`Project visibility must be a boolean: ${project.id}`);
    if (!Number.isInteger(project.order) || orders.has(project.order)) {
      throw new Error(`Project order must be a unique integer: ${project.id}`);
    }
    if (!project.href || !project.image || !project.imageFallback || !project.home?.fa || !project.home?.en || !project.about?.fa || !project.about?.en) {
      throw new Error(`Project data is incomplete: ${project.id}`);
    }
    ids.add(project.id);
    orders.add(project.order);
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char]);
}

function renderHomeImage(project, language) {
  const prefix = language === "en" ? "../img/" : "./img/";
  const alt = project.home.alt ? `alt="${escapeHtml(project.home.alt)}"` : 'alt="" aria-hidden="true"';
  return `<img src="${prefix}${escapeHtml(project.image)}" ${alt} onerror="this.src='https://placehold.co/100x100/fdfcfb/b91c1c?text=${encodeURIComponent(project.imageFallback)}'" width="80" height="80" loading="lazy" decoding="async" class="w-20 h-20 object-contain rounded-md border border-ink/5 mix-blend-multiply group-hover:scale-105 transition-transform">`;
}

function renderHomeProject(project, language) {
  const fa = project.home.fa;
  const en = project.home.en;
  return `                    <!-- ${escapeHtml(project.id)} -->
                    <a data-project-id="${escapeHtml(project.id)}" href="${escapeHtml(project.href)}" target="_blank" rel="noopener noreferrer" class="flex items-center p-4 bg-white/50 hover:bg-white border border-ink/5 hover:border-crimson/30 rounded-lg transition-all group shadow-sm hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-crimson text-start">
                        ${renderHomeImage(project, language)}
                        <div class="flex-1 px-5">
                            <h4 class="text-xl font-bold text-ink mb-1 group-hover:text-crimson transition-colors">
                                <span class="lang-fa flex items-center gap-2"><span data-edit-field="home.fa.name">${escapeHtml(fa.name)}</span> <span class="text-sm font-en text-ink/50 font-normal">| <span data-edit-field="home.en.name">${escapeHtml(en.name)}</span></span></span>
                                <span class="lang-en font-en" data-edit-field="home.en.name">${escapeHtml(en.name)}</span>
                            </h4>
                            <p class="text-sm text-ink/70 leading-relaxed dynamic-align"><span class="lang-fa" data-edit-field="home.fa.description">${escapeHtml(fa.description)}</span><span class="lang-en font-en" data-edit-field="home.en.description">${escapeHtml(en.description)}</span></p>
                        </div>
                    </a>`;
}

function renderAboutProject(project, language) {
  const copy = project.about[language];
  return `          <li><a data-project-id="${escapeHtml(project.id)}" href="${escapeHtml(project.href)}"><strong data-edit-field="about.${language}.name">${escapeHtml(copy.name)}</strong><span data-edit-field="about.${language}.description">${escapeHtml(copy.description)}</span></a></li>`;
}

function replaceRegion(html, start, end, content, file) {
  const startIndex = html.indexOf(start);
  const endIndex = html.indexOf(end);
  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex || html.indexOf(start, startIndex + start.length) !== -1) {
    throw new Error(`Generated content markers are missing or duplicated in ${file}`);
  }
  return `${html.slice(0, startIndex + start.length)}\n${content}\n${html.slice(endIndex)}`;
}

validateProjects(projects);
const orderedProjects = projects.filter((project) => project.visible).sort((a, b) => a.order - b.order);

for (const language of ["fa", "en"]) {
  const file = language === "fa" ? "index.html" : "en/index.html";
  const path = join(root, file);
  let html = await readFile(path, "utf8");
  html = replaceRegion(html, "                    <!-- PROJECT-CARDS:START -->", "                    <!-- PROJECT-CARDS:END -->", orderedProjects.map((project) => renderHomeProject(project, language)).join("\n\n"), file);
  await writeFile(path, html.replace(/\r?\n/g, "\r\n"));
}

for (const language of ["fa", "en"]) {
  const file = language === "fa" ? "about.html" : "en/about.html";
  const path = join(root, file);
  let html = await readFile(path, "utf8");
  html = replaceRegion(html, "          <!-- ABOUT-PROJECTS:START -->", "          <!-- ABOUT-PROJECTS:END -->", orderedProjects.map((project) => renderAboutProject(project, language)).join("\n"), file);
  await writeFile(path, html.replace(/\r?\n/g, "\r\n"));
}

console.log(`Generated project lists for ${orderedProjects.length} visible projects.`);
