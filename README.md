# وب‌سایت سروش زنده‌دل

وب‌سایت شخصی دوزبانهٔ سروش زنده‌دل با صفحه‌های فارسی و انگلیسی، معرفی پروژه‌ها و صفحهٔ درباره. نسخهٔ منتشرشده با GitHub Pages از فایل‌های استاتیک همین مخزن ساخته می‌شود؛ برای نمایش سایت به سرور برنامه، پایگاه داده، Docker یا سرویس‌های فونت خارجی نیاز نیست.

**نسخهٔ زنده:** [soroush-zendedel.github.io](https://soroush-zendedel.github.io/)

## نیازمندی‌ها

- **Node.js نسخهٔ ۲۰ یا جدیدتر** برای اجرای پیش‌نمایش و اسکریپت‌های ساخت.
- **pnpm نسخهٔ ۹ یا جدیدتر** برای نصب Tailwind CSS و ساخت دوبارهٔ CSS.
- **Git** برای دریافت پروژه و ثبت تغییرات.
- دسترسی GitHub به مخزنی که کلون می‌کنید برای push کردن تغییرات. اگر پروژه را فورک می‌کنید، آدرس Clone را از فورک خودتان بردارید؛ ساده‌ترین راه شروع GitHub Desktop یا Git Credential Manager است.

برای استفادهٔ معمول از ویرایشگر محتوا، لازم نیست CSS را دوباره بسازید. برای تغییر استایل و ساخت CSS، `pnpm install` لازم است.

## اجرای محلی

### ۱. دریافت پروژه

اگر می‌خواهید نسخهٔ خودتان را بسازید، ابتدا در GitHub از پروژه Fork بگیرید و سپس آدرس Clone همان فورک را استفاده کنید. Clone مستقیم مخزن اصلی فقط برای کسانی مناسب است که اجازهٔ push به آن را دارند.

با HTTPS، نام کاربری خود را در آدرس جایگزین کنید:

```bash
git clone https://github.com/YOUR-USERNAME/soroush-zendedel.github.io.git
cd soroush-zendedel.github.io
```

یا آدرس فورک خودتان را در GitHub Desktop وارد و Clone کنید.

### ۲. نصب وابستگی‌ها

اگر pnpm را ندارید، پس از نصب Node.js آن را نصب کنید:

```bash
npm install --global pnpm
```

سپس در پوشهٔ پروژه اجرا کنید:

```bash
pnpm install
```

### ۳. باز کردن پیش‌نمایش

```bash
pnpm dev
```

سایت را در مرورگر در نشانی [http://localhost:8082](http://localhost:8082) ببینید. برای توقف سرور، در همان پنجره `Ctrl+C` را بزنید. اگر پورت ۸۰۸۲ در دسترس نباشد، می‌توان پورت دیگری تعیین کرد؛ مثلاً در PowerShell ویندوز:

```powershell
$env:PORT=8083; pnpm dev
```

با دکمهٔ شناور «پرسونا» می‌توانید فایل ZIP بارگذاری کنید. بسته‌های نسخهٔ ۱ داده و آواتار می‌گیرند؛ نسخهٔ ۲ علاوه بر آن CSS و دارایی‌های تصویری و فونت محلی می‌پذیرد. در حالت `isolated`، CSS پرسونا جایگزین همهٔ استایل‌های سایت می‌شود و باید ظاهر کامل صفحه را تعریف کند. ZIP فقط در همان مرورگر ذخیره می‌شود. قالب در [راهنمای بستهٔ پرسونا](PERSONA-PACKAGE.md) آمده است.

فهرست پرسوناهای آماده برای همه در `personas/catalog.json` تعریف می‌شود. «مهندس شب» از ابتدا در این فهرست است؛ بسته‌اش هنگام انتخاب از سایت دریافت و در همان مرورگر ذخیره می‌شود.

## ویرایش محتوا در سایت

ویرایشگر بصری فقط با سرور محلی بالا فعال است و در نسخهٔ زنده نمایش داده نمی‌شود.

۱. پیش از شروع، تغییرات قبلی را commit کنید یا کنار بگذارید تا مخزن تمیز باشد. ویرایشگر تغییرهای نامرتبط را وارد commitهای محتوایی نمی‌کند.

۲. در پیش‌نمایش، «ویرایش» را روشن کنید و روی بخش موردنظر یا دکمهٔ تنظیمات آن بزنید. متن‌های فارسی و انگلیسی، لینک‌ها، تصویرها، پروژه‌ها، ترتیب و نمایش پروژه‌ها، شبکه‌های اجتماعی، اطلاعات تماس، کارت بلاگ و اطلاعات صفحهٔ درباره از همین رابط قابل تغییرند.

۳. هر بار که یک تغییر را تأیید می‌کنید، ویرایشگر داده و صفحه‌های HTML تولیدشده را ذخیره می‌کند و یک commit جداگانه روی شاخهٔ پیش‌فرض مخزن محلی می‌سازد.

۴. پس از آماده‌شدن تغییرها، «ارسال تغییرها» را بزنید. ویرایشگر commitها را به شاخهٔ پیش‌فرض مخزنی که کلون کرده‌اید می‌فرستد. اگر فورک خودتان را کلون کرده باشید، تغییرها به همان فورک ارسال می‌شوند.

۵. در مخزن اصلی، push به `main` نسخهٔ زنده را به‌روز می‌کند. در فورک، push فقط مخزن خودتان را به‌روز می‌کند؛ برای نمایش نسخهٔ فورک‌شده در وب، GitHub Pages را در تنظیمات همان فورک فعال کنید.

## فایل‌های داده و صفحه‌ها

فایل‌های JSON مرجع اصلی محتوای قابل‌ویرایش‌اند:

| فایل | کاربرد |
| --- | --- |
| `content/profile.json` | نام، عنوان، معرفی و تصویر آواتار صفحهٔ اصلی |
| `content/person.json` | اطلاعات صفحهٔ درباره، تصویر شخص، متن زندگی‌نامه و اطلاعات ساختاریافتهٔ Person/SEO |
| `content/projects.json` | پروژه‌ها، متن فارسی و انگلیسی، لینک، تصویر، ترتیب و وضعیت نمایش |
| `content/social.json` | لینک‌ها و برچسب شبکه‌های اجتماعی |
| `content/contact.json` | روش‌ها و اطلاعات تماس |
| `content/blog.json` | عنوان، توضیح، لینک و آیکون کارت بلاگ |

در `content/projects.json`، پروژه‌های فعال بر اساس `order` مرتب می‌شوند؛ شش پروژهٔ اول در صفحهٔ اصلی و همهٔ پروژه‌های فعال در صفحهٔ پروژه‌ها نمایش داده می‌شوند. مقدار `visible: false` پروژه را از نمایش عمومی پنهان می‌کند.

صفحه‌های اصلی فارسی و انگلیسی به‌ترتیب `index.html` و `en/index.html` هستند. صفحه‌های دیگر شامل `about.html`، `en/about.html`، `projects.html` و `en/projects.html` می‌شوند. این HTMLها خروجی‌های آمادهٔ انتشارند و باید همراه دادهٔ منبع commit شوند.

## تغییر مستقیم داده یا کد

ویرایشگر بصری برای تغییر محتوا ساده‌ترین راه است. اگر JSON را دستی تغییر دادید، صفحه‌های HTML وابسته را دوباره تولید کنید:

```bash
pnpm run build:site
```

این فرمان داده‌ها را اعتبارسنجی می‌کند و فهرست پروژه‌ها و محتوای قابل‌ویرایش را در شش صفحهٔ HTML بالا بازسازی می‌کند.

اگر فایل‌های CSS، کلاس‌های Tailwind یا `tailwind.input.css` را تغییر دادید، وابستگی‌ها را نصب و CSS را دوباره بسازید:

```bash
pnpm install
pnpm run build:css
```

خروجی در `assets/site.css` نوشته می‌شود. فونت‌ها نیز داخل `assets/fonts/` هستند و از همان مخزن بارگیری می‌شوند.

برای تغییر فنی روی `main`، ابتدا آن را تازه کنید:

```bash
git switch main
git pull --ff-only origin main
```

پس از تغییر و بازبینی محلی، فایل‌های لازم—including خروجی‌های ساخته‌شده—را commit و push کنید:

```bash
git status
git diff --check
git add <files>
git commit -m "Describe the change"
git push origin main
```

در این پروژه، تغییر روی `main` و push مستقیم به `origin/main` سایت زنده را به‌روز می‌کند. اگر از فورک خودتان استفاده می‌کنید، `origin` باید به همان فورک اشاره کند تا pushها فقط مخزن خودتان را تغییر دهند.

## ساختار پروژه

```text
assets/                 CSS، فونت‌های محلی و فایل‌های رابط کاربری
content/                داده‌های JSON فارسی/انگلیسی
en/                     صفحه‌های انگلیسی
img/                    تصویرهای سایت
scripts/build-site.mjs  اعتبارسنجی داده و تولید HTML
scripts/dev-server.mjs  سرور پیش‌نمایش محلی و اتصال ویرایشگر به Git
scripts/dev-editor.js   رابط ویرایش که فقط سرور محلی آن را اضافه می‌کند
index.html              صفحهٔ اصلی فارسی
about.html              صفحهٔ دربارهٔ فارسی
projects.html           فهرست پروژه‌های فارسی
```

## روش انتشار

این مخزن یک وب‌سایت استاتیک است. فایل‌های HTML، CSS، تصویر، فونت و sitemap در خود مخزن آماده‌اند؛ بنابراین برای انتشار، سرور backend یا فرمان deploy جداگانه لازم نیست. مخزن اصلی از شاخهٔ `main` و ریشهٔ مخزن در GitHub Pages منتشر می‌شود. فورک‌ها مخزن‌های مستقل‌اند و مالک فورک برای انتشار نسخهٔ خودش باید Pages را در تنظیمات فورک فعال کند.

---

# Soroush Zendedel — Personal Website

A bilingual portfolio with Persian and English home, about, and project pages. The published website is static: GitHub Pages serves the files in this repository. It needs no application server, database, Docker, or remote font service.

**Live website:** [soroush-zendedel.github.io](https://soroush-zendedel.github.io/)

## Requirements

- **Node.js 20 or newer** for the local preview and build scripts.
- **pnpm 9 or newer** to install Tailwind CSS and rebuild the stylesheet.
- **Git** to clone the repository and record changes.
- GitHub access to push changes. GitHub Desktop or Git Credential Manager is the simplest authentication option. If the repository uses SSH, configure an SSH key in GitHub first.

You do not need to rebuild CSS for ordinary content edits. `pnpm install` is required for style changes and CSS builds.

## Run locally

### 1. Clone the repository

```bash
git clone https://github.com/soroush-zendedel/soroush-zendedel.github.io.git
cd soroush-zendedel.github.io
```

You can also clone it with GitHub Desktop.

### 2. Install pnpm and project dependencies

If pnpm is not installed, run this after installing Node.js:

```bash
npm install --global pnpm
pnpm install
```

### 3. Start the preview

```bash
pnpm dev
```

Open [http://localhost:8082](http://localhost:8082). Press `Ctrl+C` in the terminal to stop the server. You can select another port, for example in Windows PowerShell:

```powershell
$env:PORT=8083; pnpm dev
```

Use the floating **Persona** button to upload a ZIP. Version 1 accepts profile data and an avatar; version 2 also accepts CSS plus local image and font assets. In `isolated` mode, the persona stylesheet replaces all site styles and must define the complete page appearance. The ZIP stays in that browser. See the [persona package guide](PERSONA-PACKAGE.md) for the archive formats.

Personas available to everyone are listed in `personas/catalog.json`. **Night Engineer** is included by default; its ZIP downloads from the site when selected and is cached in that browser.

## Edit website content

The visual editor is available only through the local preview; it is not shown on the live website.

1. Start with a clean working tree. Commit or set aside unrelated changes first.
2. Enable **Edit** in the preview and open the settings for the section you want to change. The editor supports bilingual text, links, images, projects, project order and visibility, social links, contact methods, the blog card, and About-page details.
3. Each confirmed change updates its data and generated HTML, then creates a separate commit on the repository's default branch.
4. When the edits are ready, click **Push changes**. The editor pushes those commits to the default branch of the repository you cloned. If you cloned your fork, only your fork is updated.
5. Pushing to the original repository's `main` updates its live site. To publish a fork as a website, its owner must enable GitHub Pages in that fork's settings.

## Content data and pages

These JSON files are the source of truth for editable content:

| File | Purpose |
| --- | --- |
| `content/profile.json` | Home-page name, role, introduction, and avatar |
| `content/person.json` | About-page identity, portrait, biography, and Person/SEO data |
| `content/projects.json` | Bilingual project text, links, images, order, and visibility |
| `content/social.json` | Social network labels and links |
| `content/contact.json` | Contact methods and details |
| `content/blog.json` | Blog-card title, description, link, and icon |

Visible projects are sorted by `order`. The first six appear on the home page; the projects page lists all visible projects. Set `visible` to `false` to hide a project from public pages.

The Persian and English pages are `index.html` and `en/index.html`. Other generated pages are `about.html`, `en/about.html`, `projects.html`, and `en/projects.html`. Commit generated HTML together with its source-data changes.

## Build after manual changes

After editing JSON files by hand, regenerate the HTML pages:

```bash
pnpm run build:site
```

The script validates the data and rebuilds the editable content and project lists in the six HTML pages above.

After changing CSS, Tailwind classes, or `tailwind.input.css`, install dependencies and rebuild the stylesheet:

```bash
pnpm install
pnpm run build:css
```

The output is `assets/site.css`. The site fonts are stored in `assets/fonts/` and served from this repository.

## Code changes and Git

For direct development on `main`, update it first:

```bash
git switch main
git pull --ff-only origin main
```

After reviewing your local changes, commit and push the required source and generated files:

```bash
git status
git diff --check
git add <files>
git commit -m "Describe the change"
git push origin main
```

In this project, changes on `main` and a direct push to `origin/main` update the live site. If you are working from your own fork, make sure `origin` points to that fork so pushes update only your repository.

## Project layout

```text
assets/                 CSS, local fonts, and interface assets
content/                Persian/English JSON data
en/                     English pages
img/                    Site images
scripts/build-site.mjs  Validates data and generates HTML
scripts/dev-server.mjs  Local preview server and Git editor integration
scripts/dev-editor.js   Editor UI injected only by the local server
index.html              Persian home page
about.html              Persian About page
projects.html           Persian project directory
```

## Deployment

This repository is a static website. HTML, CSS, images, fonts, and sitemap files are committed and ready to serve; no backend or separate deploy command is needed. The original repository publishes its root from `main` through GitHub Pages. Forks are independent repositories; their owners can enable Pages in the fork's settings to publish their own version.
