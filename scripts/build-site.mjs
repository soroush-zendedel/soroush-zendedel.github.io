import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const projects = JSON.parse(await readFile(join(root, "content/projects.json"), "utf8"));
const profile = JSON.parse(await readFile(join(root, "content/profile.json"), "utf8"));
const socialData = JSON.parse(await readFile(join(root, "content/social.json"), "utf8"));
const blog = JSON.parse(await readFile(join(root, "content/blog.json"), "utf8"));

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

function renderProfileFields(html, language, file) {
  for (const [key, translations] of Object.entries(profile.fields)) {
    if ((key === "role" && file === "en/index.html") || (key === "roleEnglishPage" && file !== "en/index.html")) continue;
    const value = translations[language];
    if (typeof value !== "string") throw new Error(`Missing ${language} profile content: ${key}`);
    const field = `profile.${key}.${language}`;
    const escapedField = field.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const matcher = new RegExp(`(<([a-z][a-z0-9]*)\\b(?=[^>]*\\bdata-edit-field="${escapedField}")[^>]*>)[\\s\\S]*?(<\\/\\2>)`, "gi");
    let matches = 0;
    html = html.replace(matcher, (_match, opening, _tag, closing) => {
      matches += 1;
      return `${opening}${escapeHtml(value)}${closing}`;
    });
    if (matches !== 1) throw new Error(`Expected one ${field} marker in ${file}; found ${matches}`);
  }
  const imagePrefix = language === "en" ? "../img/" : "./img/";
  const imagePattern = /(<img\s+src=")[^"]+("[^>]*class="art-avatar\b)/;
  if (!imagePattern.test(html)) throw new Error(`Profile image marker is missing in ${file}`);
  html = html.replace(imagePattern, `$1${imagePrefix}${escapeHtml(profile.avatar.image)}$2`);
  html = html.replace(/(<img\s+src="[^"]+"\s+alt=")[^"]*("[^>]*class="art-avatar\b)/, `$1${escapeHtml(profile.avatar.alt)}$2`);
  return html;
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

function renderDirectoryProject(project, language) {
  const copy = project.home[language];
  const prefix = language === "en" ? "../img/" : "./img/";
  const alt = project.home.alt ? `alt="${escapeHtml(project.home.alt)}"` : 'alt="" aria-hidden="true"';
  const fallback = encodeURIComponent(project.imageFallback);
  const image = `<img src="${prefix}${escapeHtml(project.image)}" ${alt} onerror="this.src='https://placehold.co/100x100/fdfcfb/b91c1c?text=${fallback}'" width="80" height="80" loading="lazy" decoding="async" class="w-20 h-20 object-contain rounded-md border border-ink/5 mix-blend-multiply group-hover:scale-105 transition-transform">`;
  const name = language === "fa"
    ? `<span data-edit-field="home.fa.name">${escapeHtml(copy.name)}</span> <span class="text-sm font-en text-ink/50 font-normal">| ${escapeHtml(project.home.en.name)}</span>`
    : `<span data-edit-field="home.en.name">${escapeHtml(copy.name)}</span>`;
  return `          <a data-project-id="${escapeHtml(project.id)}" href="${escapeHtml(project.href)}" target="_blank" rel="noopener noreferrer" class="flex items-center p-4 bg-white/50 hover:bg-white border border-ink/5 hover:border-crimson/30 rounded-lg transition-all group shadow-sm hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-crimson text-start">
            ${image}
            <div class="project-list-copy">
              <h2 class="text-xl font-bold text-ink mb-1 group-hover:text-crimson transition-colors">${name}</h2>
              <p data-edit-field="home.${language}.description" class="text-sm text-ink/70 leading-relaxed">${escapeHtml(copy.description)}</p>
            </div>
          </a>`;
}

function renderSocialLinks(items, language) {
  return items.slice(0, 4).map((item) => {
    const label = item[language];
    const isExternal = /^https?:\/\//i.test(item.href);
    const target = isExternal ? ' target="_blank" rel="noopener noreferrer"' : "";
    return `                            <a data-social-id="${escapeHtml(item.id)}" data-social-fa="${escapeHtml(item.fa)}" data-social-en="${escapeHtml(item.en)}" href="${escapeHtml(item.href)}"${target} aria-label="${escapeHtml(label)}" class="hover:text-crimson focus-visible:outline focus-visible:outline-2 focus-visible:outline-crimson transition-colors text-xl" title="${escapeHtml(label)}"><span class="font-en text-sm">${escapeHtml(label)}</span></a>`;
  }).join("\n");
}

function renderProfileLinks(html) {
  for (const [key, href] of Object.entries(profile.links)) {
    const matcher = new RegExp(`(<a\\b(?=[^>]*\\bdata-profile-link="${key}")[^>]*\\bhref=")[^"]*(")`, "g");
    let matches = 0;
    html = html.replace(matcher, (_match, opening, closing) => {
      matches += 1;
      return `${opening}${escapeHtml(href)}${closing}`;
    });
    if (!matches) throw new Error(`No profile link found for ${key}`);
  }
  const socials = escapeHtml(JSON.stringify(socialData.socials));
  return html.replace(/(<div\b[^>]*\bdata-social-links=")[^"]*(")/, `$1${socials}$2`);
}

function renderBlog(html, language, file) {
  const card = blog.fields;
  const linkPattern = /(<a\b[^>]*\bdata-blog-card="true"[^>]*\bhref=")[^"]*("[^>]*>)/;
  if (!linkPattern.test(html)) throw new Error(`Blog card marker is missing in ${file}`);
  html = html.replace(linkPattern, `$1${escapeHtml(blog.href)}$2`);
  for (const [key, translations] of Object.entries(card)) {
    const value = translations[language];
    if (typeof value !== "string") throw new Error(`Missing ${language} blog content: ${key}`);
    const marker = `blog.${key}.${language}`;
    const escapedMarker = marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const matcher = new RegExp(`(<([a-z][a-z0-9]*)\\b(?=[^>]*\\bdata-blog-field="${escapedMarker}")[^>]*>)[\\s\\S]*?(<\\/\\2>)`, "gi");
    let matches = 0;
    html = html.replace(matcher, (_match, opening, _tag, closing) => {
      matches += 1;
      return `${opening}${escapeHtml(value)}${closing}`;
    });
    if (matches !== 1) throw new Error(`Expected one ${marker} marker in ${file}; found ${matches}`);
  }
  return html;
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
const featuredProjects = orderedProjects.slice(0, 6);

for (const language of ["fa", "en"]) {
  const file = language === "fa" ? "index.html" : "en/index.html";
  const path = join(root, file);
  let html = await readFile(path, "utf8");
  html = renderProfileFields(html, language, file);
  html = renderBlog(html, language, file);
  html = renderProfileLinks(html);
  html = replaceRegion(html, "                            <!-- SOCIAL-LINKS:START -->", "                            <!-- SOCIAL-LINKS:END -->", renderSocialLinks(socialData.socials, language), file);
  html = replaceRegion(html, "                    <!-- PROJECT-CARDS:START -->", "                    <!-- PROJECT-CARDS:END -->", featuredProjects.map((project) => renderHomeProject(project, language)).join("\n\n"), file);
  await writeFile(path, html.replace(/\r?\n/g, "\r\n"));
}

for (const language of ["fa", "en"]) {
  const file = language === "fa" ? "projects.html" : "en/projects.html";
  const path = join(root, file);
  let html = await readFile(path, "utf8");
  html = replaceRegion(html, "          <!-- PROJECT-DIRECTORY:START -->", "          <!-- PROJECT-DIRECTORY:END -->", orderedProjects.map((project) => renderDirectoryProject(project, language)).join("\n"), file);
  const pageUrl = language === "fa"
    ? "https://soroush-zendedel.github.io/projects.html"
    : "https://soroush-zendedel.github.io/en/projects.html";
  const homeUrl = language === "fa"
    ? "https://soroush-zendedel.github.io/"
    : "https://soroush-zendedel.github.io/en/";
  const pageName = language === "fa" ? "پروژه‌ها | سروش زنده‌دل" : "Projects | Soroush Zendedel";
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${pageUrl}#webpage`,
        url: pageUrl,
        name: pageName,
        description: language === "fa"
          ? "فهرست پروژه‌ها و ابزارهای دیجیتال سروش زنده‌دل در زمینهٔ موسیقی، نوشتن، طراحی و فناوری."
          : "A directory of Soroush Zendedel’s digital projects and tools for music, writing, design, and technology.",
        inLanguage: language === "fa" ? "fa-IR" : "en",
        isPartOf: { "@id": `${homeUrl}#website` },
        breadcrumb: { "@id": `${pageUrl}#breadcrumb` },
        mainEntity: { "@id": `${pageUrl}#project-list` },
      },
      {
        "@type": "WebSite",
        "@id": `${homeUrl}#website`,
        url: homeUrl,
        name: "Soroush Zendedel | سروش زنده‌دل",
        inLanguage: ["fa-IR", "en"],
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${pageUrl}#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: language === "fa" ? "خانه" : "Home",
            item: homeUrl,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: language === "fa" ? "پروژه‌ها" : "Projects",
            item: pageUrl,
          },
        ],
      },
      {
        "@type": "ItemList",
        "@id": `${pageUrl}#project-list`,
        name: language === "fa" ? "پروژه‌های سروش زنده‌دل" : "Projects by Soroush Zendedel",
        numberOfItems: orderedProjects.length,
        itemListElement: orderedProjects.map((project, index) => ({
          "@type": "ListItem",
          position: index + 1,
          item: {
            "@type": "CreativeWork",
            name: project.home[language].name,
            url: project.href,
            description: project.home[language].description,
            image: `https://soroush-zendedel.github.io/img/${project.image}`,
            identifier: project.id,
          },
        })),
      },
    ],
  };
  const schemaJson = JSON.stringify(schema).replace(/</g, "\\u003c");
  const schemaScript = /<script type="application\/ld\+json">[\s\S]*?<\/script>/;
  if (!schemaScript.test(html)) {
    throw new Error(`Project schema marker is missing or duplicated in ${file}`);
  }
  html = html.replace(schemaScript, `<script type="application/ld+json">${schemaJson}</script>`);
  await writeFile(path, html.replace(/\r?\n/g, "\r\n"));
}

for (const language of ["fa", "en"]) {
  const file = language === "fa" ? "about.html" : "en/about.html";
  const path = join(root, file);
  let html = await readFile(path, "utf8");
  html = replaceRegion(html, "          <!-- ABOUT-PROJECTS:START -->", "          <!-- ABOUT-PROJECTS:END -->", orderedProjects.map((project) => renderAboutProject(project, language)).join("\n"), file);
  await writeFile(path, html.replace(/\r?\n/g, "\r\n"));
}

console.log(`Generated bilingual project lists for ${orderedProjects.length} visible projects.`);
