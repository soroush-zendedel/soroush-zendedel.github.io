# سروش زنده‌دل — وب‌سایت نمونه‌کار

وب‌سایت شخصی و دوزبانهٔ سروش زنده‌دل؛ مجموعه‌ای از ابزارها و تجربه‌های دیجیتال در زمینهٔ موسیقی، نوشتن و پروژه‌های خلاقانه. نسخهٔ فارسی راست‌چین است و نسخهٔ انگلیسی در مسیر جداگانهٔ [`/en/`](https://soroush-zendedel.github.io/en/) قرار دارد.

**مشاهدهٔ وب‌سایت:** [soroush-zendedel.github.io](https://soroush-zendedel.github.io/)

## پروژه‌ها

- [Tara](https://soroush-zendedel.github.io/tara/) — ابزار دیداری برای یادگیری و تمرین تئوری موسیقی.
- [Shenobin](https://soroush-zendedel.github.io/shenobin/) — محیط ساخت موسیقی برای آهنگ‌سازی، بررسی هارمونی و خروجی MIDI یا WAV.
- [Khater](https://soroush-zendedel.github.io/khater/) — ابزار تمرین، طراحی و ساخت فونت.
- [Notella](https://github.com/soroush-zendedel/notella) — اپلیکیشن یادداشت‌برداری پایتون با رابط خط فرمان و وب.
- [Silk Road](https://soroush-zendedel.github.io/silk-road/) — پروژه‌ای دربارهٔ واژه‌ها و روایت‌های جادهٔ ابریشم.
- [Countdown](https://soroush-zendedel.github.io/countdown/) — ابزار شمارش معکوس برای مدیریت زمان و تمرکز.
- [ثبت‌احوال](https://soroush-zendedel.github.io/personal-blog/) — وبلاگ نوشته‌ها، اندیشه‌ها و شعرها.

## ساختار

- `index.html` — صفحهٔ اصلی فارسی.
- `en/index.html` — نسخهٔ انگلیسی.
- `assets/site.css` — استایل کامپایل‌شده و فشردهٔ Tailwind CSS.
- `img/` — تصویرهای اصلی و نسخه‌های WebP مورد استفادهٔ سایت.
- `robots.txt` و `sitemap.xml` — فایل‌های راهنمای خزنده‌های موتور جست‌وجو.

## توسعه

برای بازسازی CSS به Node.js و pnpm نیاز است:

```bash
pnpm install
pnpm run build:css
```

فایل `assets/site.css` خروجیِ مورد استفادهٔ سایت است و باید همراه تغییرهای HTML پوش شود. سایت استاتیک است و برای انتشار به فرایند build در GitHub Pages نیاز ندارد، تا وقتی که CSS کامپایل‌شده به‌روز باشد.

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
- `assets/site.css` — Minified, compiled Tailwind CSS.
- `img/` — Original images and the WebP versions served by the site.
- `robots.txt` and `sitemap.xml` — Search crawler guidance and sitemap.

## Development

Node.js and pnpm are required to rebuild the stylesheet:

```bash
pnpm install
pnpm run build:css
```

The site serves `assets/site.css`; include the rebuilt file with HTML changes. It is a static site and needs no GitHub Pages build step as long as the compiled stylesheet is up to date.
