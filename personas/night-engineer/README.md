# Night Engineer persona template

This is an original, self-contained persona package for a moonlit software workspace. It uses the site's existing portrait, original bilingual copy, local fonts, and an independent stylesheet, with generic night-sky motifs and no franchise-specific characters, settings, or symbols.

- `manifest.json` selects the isolated style mode and defines the persona ID.
- `profile.json` follows the shared bilingual profile schema.
- `styles/night-engineer.css` controls the full appearance, responsive layout, typography, and moonlit effects.
- The six palette tokens are gold accent, white secondary, deep navy background, shared navy card surface (`#111a27`), translucent blue-gray border, and pale blue-gray neutral.
- Shared animations, page surfaces, bubble backgrounds, project cards, borders, and neutral social links consume these tokens by default; component-specific CSS can override them.
- Contact-menu text and icon controls use the secondary white for contrast against the dark panel.
- Floating persona and guide controls share a black background and white content before collapsing; their borders use the fixed border token and their icons use gold in the collapsed state.
- `images/avatar.jpg` is copied from the site's existing portrait.
- `assets/fonts/` and `licenses/` contain the fonts and their OFL notices.

To create another persona, copy this folder, choose a new ID and label, edit `profile.json` and the stylesheet, then ZIP the folder contents so `manifest.json` is at the archive root. CSS asset paths must begin with `assets/`.

English headings and controls use Oxanium; longer text uses the bundled Vazirmatn Latin face. Persian uses bundled Vazirmatn. All fonts load locally from this package.
