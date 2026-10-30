# Night Engineer persona template

This is an original, self-contained persona package for a moonlit software workspace. It uses the site's existing portrait, original bilingual copy, local fonts, and an independent stylesheet, with generic night-sky motifs and no franchise-specific characters, settings, or symbols.

- `manifest.json` selects the isolated style mode and defines the persona ID.
- `profile.json` follows the shared bilingual profile schema.
- `styles/night-engineer.css` controls the full appearance, responsive layout, typography, and moonlit effects.
- `images/avatar.jpg` is copied from the site's existing portrait.
- `assets/fonts/` and `licenses/` contain the fonts and their OFL notices.

To create another persona, copy this folder, choose a new ID and label, edit `profile.json` and the stylesheet, then ZIP the folder contents so `manifest.json` is at the archive root. CSS asset paths must begin with `assets/`.

English headings and controls use Oxanium; longer text uses the bundled Vazirmatn Latin face. Persian uses bundled Vazirmatn. All fonts load locally from this package.
