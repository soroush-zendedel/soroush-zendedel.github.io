import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const projects = JSON.parse(await readFile(join(root, "content/projects.json"), "utf8"));
const profile = JSON.parse(await readFile(join(root, "content/profile.json"), "utf8"));
const socialData = JSON.parse(await readFile(join(root, "content/social.json"), "utf8"));
const contactData = JSON.parse(await readFile(join(root, "content/contact.json"), "utf8"));
const blog = JSON.parse(await readFile(join(root, "content/blog.json"), "utf8"));
const person = JSON.parse(await readFile(join(root, "content/person.json"), "utf8"));
if (!/^[a-z0-9][a-z0-9-]{0,115}\.(?:jpe?g|png|webp|gif|avif|bmp)$/i.test(person.image.file)) {
  throw new Error("The About portrait filename must be a safe English image filename.");
}
const blogIcons = {
  book: '<svg data-blog-icon="book" class="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M12 7v14M3 5.5A2.5 2.5 0 0 1 5.5 3H12v18H5.5A2.5 2.5 0 0 0 3 23V5.5ZM21 5.5A2.5 2.5 0 0 0 18.5 3H12v18h6.5A2.5 2.5 0 0 1 21 23V5.5Z"/></svg>',
  pen: '<svg data-blog-icon="pen" class="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="m12 19 7-7 3 3-7 7-3-3ZM18 13l-7-7a3.5 3.5 0 0 0-5 0l-3 3 7 7M2 22l5-1-4-4-1 5Z"/><path d="m9 8 7 7"/></svg>',
  page: '<svg data-blog-icon="page" class="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M7 3h7l5 5v13H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/><path d="M14 3v5h5M9 13h6M9 17h6"/></svg>',
};

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
  return `<img src="${prefix}${escapeHtml(project.image)}" ${alt} width="80" height="80" loading="lazy" decoding="async" class="w-20 h-20 object-contain rounded-md border border-ink/5 mix-blend-multiply group-hover:scale-105 transition-transform">`;
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

function renderSiteFooter(language) {
  const credit = escapeHtml(profile.fields.footerCredit[language]);
  const email = escapeHtml(profile.fields.footerEmail[language]);
  return `  <footer class="site-footer" dir="ltr">
    <p><span data-edit-field="profile.footerCredit.${language}">${credit}</span> © <span id="year"></span></p>
    <a data-profile-link="contact" href="${escapeHtml(profile.links.contact)}"><span data-edit-field="profile.footerEmail.${language}">${email}</span></a>
  </footer>
  <script>document.getElementById("year").textContent = new Date().getFullYear();</script>`;
}

function renderSiteNav(language, currentPage) {
  const pagePaths = {
    home: { fa: "/", en: "/en/" },
    about: { fa: "/about.html", en: "/en/about.html" },
    projects: { fa: "/projects.html", en: "/en/projects.html" },
  };
  const label = (page) => page === "home" ? (language === "fa" ? "خانه" : "Home")
    : page === "about" ? (language === "fa" ? "درباره‌ی من" : "About")
      : escapeHtml(profile.fields.projectsNav[language]);
  const navLink = (page, href) => `<a${currentPage === page ? ' aria-current="page"' : ""}${page === "home" ? ' rel="home"' : page === "projects" ? ' data-profile-link="projects"' : ""} class="bg-canvas border border-ink/20 shadow-sm rounded-full px-5 py-1.5 text-sm font-bold transition-all" href="${escapeHtml(href)}">${page === "projects" ? `<span data-edit-field="profile.projectsNav.${language}">${label(page)}</span>` : label(page)}</a>`;
  const languageHref = pagePaths[currentPage][language === "fa" ? "en" : "fa"];
  const languageLabel = language === "fa" ? "EN" : "فا";
  const languageAria = language === "fa" ? "View English version" : "مشاهده نسخه فارسی";
  const languageText = language === "fa" ? languageLabel : `<span class="font-fa">${languageLabel}</span>`;
  return `  <nav class="top-navigation w-full max-w-5xl mx-auto items-center mb-4" aria-label="${language === "fa" ? "پیمایش اصلی" : "Main navigation"}">
    ${navLink("home", "./")}
    ${navLink("about", "./about.html")}
    ${navLink("projects", profile.links.projects)}
    <a id="langToggle" href="${languageHref}" hreflang="${language === "fa" ? "en" : "fa"}" aria-label="${languageAria}" class="bg-canvas border border-ink/20 shadow-sm rounded-full px-5 py-1.5 text-sm font-bold tracking-widest transition-all flex items-center gap-2"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/></svg>${languageText}</a>
  </nav>`;
}

function renderDirectoryProject(project, language) {
  const copy = project.home[language];
  const prefix = language === "en" ? "../img/" : "./img/";
  const alt = project.home.alt ? `alt="${escapeHtml(project.home.alt)}"` : 'alt="" aria-hidden="true"';
  const fallback = encodeURIComponent(project.imageFallback);
  const image = `<img src="${prefix}${escapeHtml(project.image)}" ${alt} width="80" height="80" loading="lazy" decoding="async" class="w-20 h-20 object-contain rounded-md border border-ink/5 mix-blend-multiply group-hover:scale-105 transition-transform">`;
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

function renderContactMenu(language) {
  if (!Array.isArray(contactData.methods) || contactData.methods.length > 10) throw new Error("Contact methods must be a list of up to 10 items.");
  const ids = new Set();
  return contactData.methods.map((item) => {
    if (!item || !/^(phone|sms|whatsapp|telegram|email)$/.test(item.id) || ids.has(item.id)) throw new Error(`Invalid or duplicate contact method: ${item?.id}`);
    ids.add(item.id);
    if (typeof item.fa !== "string" || typeof item.en !== "string" || typeof item.href !== "string") throw new Error(`Incomplete contact method: ${item.id}`);
    const allowed = item.id === "phone" ? /^tel:\+[0-9]{8,15}$/ : item.id === "sms" ? /^sms:\+[0-9]{8,15}$/ : item.id === "whatsapp" ? /^https:\/\/wa\.me\/[0-9]{8,15}$/ : item.id === "telegram" ? /^https:\/\/t\.me\/[A-Za-z0-9_]{5,32}$/ : /^mailto:[^\s@]+@[^\s@]+\.[^\s@]+$/i;
    if (!allowed.test(item.href)) throw new Error(`Unsafe URL for contact method: ${item.id}`);
    const glyph = { phone: "☎", sms: "▤", whatsapp: "◉", telegram: "➤", email: "✉" }[item.id];
    return `                    <a class="contact-method" href="${escapeHtml(item.href)}" data-contact-method="${item.id}"><span class="contact-method-icon" aria-hidden="true">${glyph}</span><span><span class="lang-fa">${escapeHtml(item.fa)}</span><span class="lang-en font-en">${escapeHtml(item.en)}</span></span><span class="contact-method-arrow" aria-hidden="true">↗</span></a>`;
  }).join("\n");
}

function renderBlog(html, language, file) {
  const card = blog.fields;
  if (!blogIcons[blog.icon]) throw new Error(`Unsupported blog icon: ${blog.icon}`);
  const iconMatcher = /<svg\b[^>]*\bdata-blog-icon="[a-z]+"[^>]*>[\s\S]*?<\/svg>/;
  if (!iconMatcher.test(html)) throw new Error(`Blog icon marker is missing in ${file}`);
  html = html.replace(iconMatcher, blogIcons[blog.icon]);
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

function renderPersonLinks(language) {
  return socialData.socials.slice(0, 4).map((item) => {
    const isEmail = item.href.startsWith("mailto:");
    const attrs = isEmail ? ' rel="me"' : ' target="_blank" rel="noopener noreferrer me"';
    return `<a href="${escapeHtml(item.href)}"${attrs}>${escapeHtml(item[language])}</a>`;
  }).join("\n        ");
}

function renderPersonFamily(language) {
  return person.family[language].split(/(\{\{book\d+\}\})/g).map((part) => {
    const token = part.match(/^\{\{(book\d+)\}\}$/);
    if (!token) return escapeHtml(part);
    const book = person.books.find((item) => item.id === token[1]);
    if (!book) throw new Error(`Missing person book link: ${token[1]}`);
    const label = escapeHtml(book.label[language]);
    return `<a href="${escapeHtml(book.href)}" target="_blank" rel="noopener noreferrer">${language === "en" ? `<em>${label}</em>` : label}</a>`;
  }).join("");
}

function renderPersonSchema(language) {
  const pageUrl = language === "fa"
    ? "https://soroush-zendedel.github.io/about.html"
    : "https://soroush-zendedel.github.io/en/about.html";
  const homeUrl = language === "fa"
    ? "https://soroush-zendedel.github.io/"
    : "https://soroush-zendedel.github.io/en/";
  const schema = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    name: person.fields.seoTitle[language],
    url: pageUrl,
    inLanguage: language,
    mainEntity: {
      "@type": "Person",
      "@id": "https://soroush-zendedel.github.io/#person",
      name: person.structuredData.fullName,
      alternateName: person.structuredData.alternateNames,
      url: "https://soroush-zendedel.github.io/",
      image: `https://soroush-zendedel.github.io/img/${person.image.file}`,
      jobTitle: person.structuredData.jobTitles,
      description: person.structuredData.descriptions[language],
      knowsLanguage: person.structuredData.knowsLanguage,
      alumniOf: person.structuredData.alumniOf.map((name) => ({ "@type": name.includes("University") ? "CollegeOrUniversity" : "EducationalOrganization", name })),
      knowsAbout: person.structuredData.knowsAbout,
      sameAs: socialData.socials.map((item) => item.href).filter((href) => /^https?:\/\//i.test(href)),
    },
  };
  return JSON.stringify(schema).replace(/</g, "\\u003c");
}

function renderPersonBreadcrumbSchema(language) {
  const homeUrl = language === "fa" ? "https://soroush-zendedel.github.io/" : "https://soroush-zendedel.github.io/en/";
  const pageUrl = language === "fa" ? "https://soroush-zendedel.github.io/about.html" : "https://soroush-zendedel.github.io/en/about.html";
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: person.fields.homeLabel[language], item: homeUrl },
      { "@type": "ListItem", position: 2, name: person.fields.aboutLabel[language], item: pageUrl },
    ],
  };
  return JSON.stringify(schema).replace(/</g, "\\u003c");
}

function renderPersonPage(html, language, file) {
  for (const [key, translations] of Object.entries(person.fields)) {
    if (["seoDescription", "blogLinkText", "blogHref", "profilesLabel", "breadcrumbLabel"].includes(key)) continue;
    const value = translations[language];
    if (typeof value !== "string") throw new Error(`Missing ${language} person content: ${key}`);
    if (["writingText"].includes(key)) {
      const linkText = person.fields.blogLinkText[language];
      const linkHref = person.fields.blogHref[language];
      if (!isSafeLocalOrWebUrl(linkHref)) throw new Error(`Unsafe About link: ${linkHref}`);
      const rendered = value.split(/(\{\{blog\}\})/g).map((part) => part === "{{blog}}"
        ? `<a href="${escapeHtml(linkHref)}">${escapeHtml(linkText)}</a>`
        : escapeHtml(part)).join("");
      html = replacePersonText(html, `fields.${key}.${language}`, rendered, file);
    } else {
      html = replacePersonText(html, `fields.${key}.${language}`, escapeHtml(value), file);
    }
  }
  const imagePrefix = language === "en" ? "../img/" : "./img/";
  const imagePath = `${imagePrefix}${escapeHtml(person.image.file)}`;
  html = html.replace(/(<img\b[^>]*class="portrait"[^>]*\bsrc=")[^"]*("[^>]*\balt=")[^"]*(")/, `$1${imagePath}$2${escapeHtml(person.image.alt[language])}$3`);
  html = html.replace(/(<meta\b[^>]*\bname="author"[^>]*\bcontent=")[^"]*(")/, `$1${escapeHtml(person.structuredData.fullName)}$2`);
  html = html.replace(/(<meta\b[^>]*\bproperty="og:image"[^>]*\bcontent=")[^"]*(")/, `$1https://soroush-zendedel.github.io/img/${escapeHtml(person.image.file)}$2`);
  html = html.replace(/(<meta\b[^>]*\bname="twitter:image"[^>]*\bcontent=")[^"]*(")/, `$1https://soroush-zendedel.github.io/img/${escapeHtml(person.image.file)}$2`);
  html = html.replace(/(<meta\b[^>]*\bname="description"[^>]*\bcontent=")[^"]*("[^>]*\bdata-person-meta="seoDescription"[^>]*>)/, `$1${escapeHtml(person.fields.seoDescription[language])}$2`);
  for (const metaName of ["og:title", "twitter:title"]) {
    html = html.replace(new RegExp(`(<meta\\b[^>]*\\b(?:property|name)="${metaName}"[^>]*\\bcontent=\")[^\"]*(\"[^>]*>)`), `$1${escapeHtml(person.fields.seoTitle[language])}$2`);
  }
  for (const metaName of ["og:description", "twitter:description"]) {
    html = html.replace(new RegExp(`(<meta\\b[^>]*\\b(?:property|name)="${metaName}"[^>]*\\bcontent=\")[^\"]*(\"[^>]*>)`), `$1${escapeHtml(person.fields.seoDescription[language])}$2`);
  }
  html = html.replace(/(<nav\b[^>]*class="links"[^>]*\baria-label=")[^"]*(")/, `$1${escapeHtml(person.fields.profilesLabel[language])}$2`);
  html = html.replace(/(<nav\b[^>]*class="breadcrumbs"[^>]*\baria-label=")[^"]*(")/, `$1${escapeHtml(person.fields.breadcrumbLabel[language])}$2`);
  const schemaPattern = /<script type="application\/ld\+json" data-person-schema>[\s\S]*?<\/script>/;
  if (!schemaPattern.test(html)) throw new Error(`Person schema marker is missing in ${file}`);
  html = html.replace(schemaPattern, `<script type="application/ld+json" data-person-schema>${renderPersonSchema(language)}</script>`);
  const breadcrumbSchemaPattern = /<script type="application\/ld\+json" data-person-breadcrumb-schema>[\s\S]*?<\/script>/;
  if (!breadcrumbSchemaPattern.test(html)) throw new Error(`Person breadcrumb schema marker is missing in ${file}`);
  html = html.replace(breadcrumbSchemaPattern, `<script type="application/ld+json" data-person-breadcrumb-schema>${renderPersonBreadcrumbSchema(language)}</script>`);
  const renderPersonList = (items) => items.map((item) => {
    const value = item[language];
    const colon = value.indexOf(":");
    return colon > -1 ? `<li><strong>${escapeHtml(value.slice(0, colon + 1))}</strong>${escapeHtml(value.slice(colon + 1))}</li>` : `<li><strong>${escapeHtml(value)}</strong></li>`;
  }).join("\n          ");
  html = replaceRegion(html, "<!-- PERSON-CAREER:START -->", "<!-- PERSON-CAREER:END -->", renderPersonList(person.career), file);
  html = replaceRegion(html, "<!-- PERSON-EDUCATION:START -->", "<!-- PERSON-EDUCATION:END -->", renderPersonList(person.education), file);
  const familyPattern = /(<p\b[^>]*data-person-family="true"[^>]*>)[\s\S]*?(<\/p>)/;
  if (!familyPattern.test(html)) throw new Error(`Person family marker is missing in ${file}`);
  html = html.replace(familyPattern, `$1${renderPersonFamily(language)}$2`);
  html = replaceRegion(html, "<!-- PERSON-PROFILES:START -->", "<!-- PERSON-PROFILES:END -->", renderPersonLinks(language), file);
  const socialLinksData = escapeHtml(JSON.stringify(socialData.socials));
  const socialNav = html.match(/<nav\b[^>]*\bclass="links"[^>]*>/);
  if (!socialNav) throw new Error(`Social links navigation is missing in ${file}`);
  const cleanSocialNav = socialNav[0].replace(/\sdata-social-links="[^"]*"/g, "");
  html = html.replace(socialNav[0], `${cleanSocialNav.slice(0, -1)} data-social-links="${socialLinksData}">`);
  const personData = escapeHtml(JSON.stringify(person));
  const mainTag = html.match(/<main\b[^>]*\bclass="sheet"[^>]*>/);
  if (!mainTag) throw new Error(`Person page main element is missing in ${file}`);
  const cleanMainTag = mainTag[0]
    .replace(/\sdata-person-page="[^"]*"/g, "")
    .replace(/\sdata-person-data="[^"]*"/g, "");
  html = html.replace(mainTag[0], cleanMainTag.replace(/>$/, ` data-person-page="true" data-person-data="${personData}">`));
  return html;
}

function isSafeLocalOrWebUrl(value) {
  try { return ["http:", "https:"].includes(new URL(value).protocol); } catch { return false; }
}

function replacePersonText(html, key, value, file) {
  const marker = `person.${key}`;
  const escapedMarker = marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const matcher = new RegExp(`(<([a-z][a-z0-9]*)\\b(?=[^>]*\\bdata-person-field="${escapedMarker}")[^>]*>)[\\s\\S]*?(<\\/\\2>)`, "gi");
  let matches = 0;
  html = html.replace(matcher, (_match, opening, _tag, closing) => {
    matches += 1;
    return `${opening}${value}${closing}`;
  });
  if (matches !== 1) throw new Error(`Expected one ${marker} marker in ${file}; found ${matches}`);
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
  html = replaceRegion(html, "<!-- SITE-NAV:START -->", "<!-- SITE-NAV:END -->", renderSiteNav(language, "home"), file);
  html = renderProfileFields(html, language, file);
  html = renderBlog(html, language, file);
  html = renderProfileLinks(html);
  html = replaceRegion(html, "                    <!-- CONTACT-METHODS:START -->", "                    <!-- CONTACT-METHODS:END -->", renderContactMenu(language), file);
  html = replaceRegion(html, "                            <!-- SOCIAL-LINKS:START -->", "                            <!-- SOCIAL-LINKS:END -->", renderSocialLinks(socialData.socials, language), file);
  html = replaceRegion(html, "                    <!-- PROJECT-CARDS:START -->", "                    <!-- PROJECT-CARDS:END -->", featuredProjects.map((project) => renderHomeProject(project, language)).join("\n\n"), file);
  html = replaceRegion(html, "<!-- SITE-FOOTER:START -->", "<!-- SITE-FOOTER:END -->", renderSiteFooter(language), file);
  await writeFile(path, html.replace(/\r?\n/g, "\r\n"));
}

for (const language of ["fa", "en"]) {
  const file = language === "fa" ? "projects.html" : "en/projects.html";
  const path = join(root, file);
  let html = await readFile(path, "utf8");
  html = replaceRegion(html, "<!-- SITE-NAV:START -->", "<!-- SITE-NAV:END -->", renderSiteNav(language, "projects"), file);
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
  html = replaceRegion(html, "  <!-- SITE-FOOTER:START -->", "  <!-- SITE-FOOTER:END -->", renderSiteFooter(language), file);
  html = renderProfileLinks(html);
  await writeFile(path, html.replace(/\r?\n/g, "\r\n"));
}

for (const language of ["fa", "en"]) {
  const file = language === "fa" ? "about.html" : "en/about.html";
  const path = join(root, file);
  let html = await readFile(path, "utf8");
  html = replaceRegion(html, "<!-- SITE-NAV:START -->", "<!-- SITE-NAV:END -->", renderSiteNav(language, "about"), file);
  html = renderPersonPage(html, language, file);
  html = replaceRegion(html, "          <!-- ABOUT-PROJECTS:START -->", "          <!-- ABOUT-PROJECTS:END -->", orderedProjects.map((project) => renderAboutProject(project, language)).join("\n"), file);
  html = replaceRegion(html, "  <!-- SITE-FOOTER:START -->", "  <!-- SITE-FOOTER:END -->", renderSiteFooter(language), file);
  html = renderProfileLinks(html);
  await writeFile(path, html.replace(/\r?\n/g, "\r\n"));
}

console.log(`Generated bilingual project lists for ${orderedProjects.length} visible projects.`);
