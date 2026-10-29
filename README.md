# سروش زنده‌دل — وب‌سایت نمونه‌کار

وب‌سایت شخصی و دوزبانهٔ من؛ مجموعه‌ای از ابزارها و تجربه‌های دیجیتال در زمینهٔ موسیقی، نوشتن و پروژه‌های خلاقانه. نسخهٔ فارسی راست‌چین است و نسخهٔ انگلیسی در مسیر جداگانهٔ [`/en/`](https://soroush-zendedel.github.io/en/) قرار دارد.

**مشاهدهٔ وب‌سایت:** [soroush-zendedel.github.io](https://soroush-zendedel.github.io/)

## پروژه‌ها

- [Tara](https://soroush-zendedel.github.io/tara/) — ابزار دیداری برای یادگیری و تمرین تئوری موسیقی.
- [Shenobin](https://soroush-zendedel.github.io/shenobin/) — محیط ساخت موسیقی برای آهنگ‌سازی، بررسی هارمونی و خروجی MIDI یا WAV.
- [Khater](https://soroush-zendedel.github.io/khater/) — ابزار تمرین، طراحی و ساخت فونت.
- [Notella](https://github.com/soroush-zendedel/notella) — اپلیکیشن یادداشت‌برداری پایتون با رابط خط فرمان و وب.
- [Silk Road](https://soroush-zendedel.github.io/silk-road/) — پروژه‌ای دربارهٔ واژه‌ها و روایت‌های جادهٔ ابریشم.
- [Countdown](https://soroush-zendedel.github.io/countdown/) — پژوهش‌های شمارش معکوس برای دیدن گذر زمان و تاریخ اعداد.
- [ثبت‌احوال](https://soroush-zendedel.github.io/personal-blog/) — وبلاگ نوشته‌ها، اندیشه‌ها و شعرها.

## ساختار

- `index.html` — صفحهٔ اصلی فارسی.
- `en/index.html` — نسخهٔ انگلیسی.
- `content/projects.json` — مرجع ترتیب، وضعیت نمایش، لینک و متن دوزبانهٔ پروژه‌ها.
- `scripts/build-site.mjs` — ساخت فهرست پروژه‌ها در صفحهٔ اصلی و صفحهٔ درباره، برای هر دو زبان.
- `assets/site.css` — استایل کامپایل‌شده و فشردهٔ Tailwind CSS.
- `img/` — تصویرهای اصلی و نسخه‌های WebP مورد استفادهٔ سایت.
- `robots.txt` و `sitemap.xml` — فایل‌های راهنمای خزنده‌های موتور جست‌وجو.

## توسعه

برای اجرای پیش‌نمایش محلی با ابزار ویرایش متن و ترتیب پروژه‌ها، بدون نصب بستهٔ اضافه:

```bash
node scripts/dev-server.mjs
```

سپس [پیش‌نمایش محلی](http://localhost:8082/) را باز کنید. در صورت استفاده از npm، دستور `npm run dev` هم در دسترس است.

ویرایش فقط هنگام اجرای این سرور در دسترس است. تأیید هر تغییر، فایل داده و صفحه‌های تولیدشده را به‌روزرسانی می‌کند و یک کامیت مستقل می‌سازد؛ لغو تغییری ذخیره نمی‌کند. اگر تغییر ذخیره‌نشدهٔ دیگری در مخزن باشد، ویرایشگر برای جلوگیری از ترکیب تغییرها ذخیره را متوقف می‌کند.
در هر نوبت ویرایش می‌توان همهٔ کامیت‌های ساخته‌شده توسط ویرایشگر را با دکمهٔ «لغو این نوبت» به وضعیت پیش از شروع برگرداند؛ این کار پس از تأیید انجام می‌شود و اگر در آن بازه کامیت نامرتبطی وجود داشته باشد، متوقف خواهد شد.

برای تولید صفحه‌های HTML از فهرست پروژه‌ها، Node.js کافی است:

```bash
pnpm run build:site
```

برای بازسازی CSS به Node.js و pnpm نیاز است:

```bash
pnpm install
pnpm run build:css
```

فایل‌های HTML تولیدشده و `assets/site.css` خروجی‌های مورد استفادهٔ سایت‌اند و باید همراه تغییرهای منبع پوش شوند. سایت استاتیک است و برای انتشار به فرایند build در GitHub Pages نیاز ندارد.

---

# Soroush Zendedel — Portfolio

A bilingual personal portfolio featuring creative digital tools and projects around music, writing, and digital experiences. The Persian edition is right-to-left; the English edition lives at [`/en/`](https://soroush-zendedel.github.io/en/).

**Visit the website:** [soroush-zendedel.github.io](https://soroush-zendedel.github.io/)

## Projects

- [Tara](https://soroush-zendedel.github.io/tara/) — A visual tool for learning and practicing music theory.
- [Shenobin](https://soroush-zendedel.github.io/shenobin/) — A browser-based music studio for composition, harmony, and MIDI or WAV export.
- [Khater](https://soroush-zendedel.github.io/khater/) — A tool for practicing, designing, and creating fonts.
- [Notella](https://github.com/soroush-zendedel/notella) — A Python note-taking app with command-line and web interfaces.
- [Silk Road](https://soroush-zendedel.github.io/silk-road/) — A project about the words and stories of the Silk Road.
- [Countdown](https://soroush-zendedel.github.io/countdown/) — A countdown timer for time awareness and focus.
- [Sabte Ahval](https://soroush-zendedel.github.io/personal-blog/) — A personal blog for writing, reflections, and poetry.

## Project structure

- `index.html` — Persian home page.
- `en/index.html` — English edition.
- `content/projects.json` — source of truth for project order, visibility, links, and bilingual text.
- `scripts/build-site.mjs` — generates project lists on both home and about pages in both languages.
- `assets/site.css` — Minified, compiled Tailwind CSS.
- `img/` — Original images and the WebP versions served by the site.
- `robots.txt` and `sitemap.xml` — Search crawler guidance and sitemap.

## Development

Start the local preview with inline project-text editing and drag-to-reorder, without installing any additional package:

```bash
node scripts/dev-server.mjs
```

Then open the [local preview](http://localhost:8082/). If you use npm, `npm run dev` is also available.

The editor is available only through this local server. Each confirmed edit updates the data and generated pages in its own Git commit; canceling leaves files unchanged. Saving is blocked while other uncommitted changes exist, so unrelated work is never included.
During an editing session, the “Undo this session” button can restore all editor commits to the state from before editing began. It asks for confirmation and refuses to proceed if unrelated commits are found in that range.

Use Node.js to generate the project lists from their data:

```bash
pnpm run build:site
```

Node.js and pnpm are required to rebuild the stylesheet:

```bash
pnpm install
pnpm run build:css
```

The generated HTML and `assets/site.css` are the files served by GitHub Pages. Commit generated HTML with source-data changes; the site remains static and needs no GitHub Pages build step.
