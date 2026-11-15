# Theming & Customization

When a consumer wants GHDS to match their brand ("make the primary color blue", "use our brand palette", "match our dark theme"), the answer is **almost never to edit components or hardcode colors** — it is to override GHDS's CSS custom properties. `@ghds/tokens/css` emits a live `comp → sys → ref` reference chain, so redefining one variable cascades to everything that consumes it.

## Rebrand by overriding `--sys-*`, not by hardcoding

The semantic (`--sys-*`) layer is the correct customization surface. Each variable is a role (`primary`, `danger`, `text-link`…), and overriding it re-themes every component that plays that role. Never fork a component or inline a brand color to achieve a theme change.

```css
/* Incorrect — hardcodes a brand color onto one component; every other
   primary-colored component (badges, links, focus rings) stays the old color,
   and dark mode is lost. */
.my-app .gh-button {
  background-color: #0969da;
}
```

```css
/* Correct — override the semantic token once; buttons, badges, links, and
   focus rings that map to the primary role all update together. */
:root {
  --sys-color-bg-primary-default: #0969da;
  --sys-color-bg-primary-hover: #0757ba;
  --sys-color-text-link: #0969da;
  --sys-color-border-focus: #218bff;
}
```

## Always cover dark mode at the same specificity

GHDS toggles themes with a `data-theme="dark"` attribute (falling back to `prefers-color-scheme`). The dark theme re-declares the semantic variables, so a `:root` override alone is silently replaced in dark mode. Set dark values under the dark selector too.

```css
/* Incorrect — only light is themed; dark mode reverts to GHDS defaults. */
:root {
  --sys-color-bg-primary-default: #0969da;
}
```

```css
/* Correct — both themes are covered. */
:root {
  --sys-color-bg-primary-default: #0969da;
}
[data-theme="dark"] {
  --sys-color-bg-primary-default: #218bff;
}
```

## Pick the layer that matches the scope of the change

- **`--sys-*` (semantic) — the default.** Change a role: `--sys-color-bg-primary-default`, `--sys-color-text-link`, `--sys-color-border-focus`. Reaches every component using that role.
- **`--ref-*` (palette) — a whole-palette reskin.** Redefine `--ref-palette-brand-600` to shift every semantic token that references it in one move. Use for changing the underlying color ramp, not a single role.
- **`--comp-*` (component) — one component only.** Override `--comp-button-bg-primary-default` to retune a single component without touching anything else that shares its semantic token.

Do **not** point a consumer at `--comp-*` for a brand-wide change, or at `--sys-*` when they only want to tweak one component — match the layer to the blast radius.

## React Native has no CSS cascade

CSS-variable overrides apply to `@ghds/react` and `@ghds/web-components` only. React Native resolves tokens as a JS object (`import { tokens } from '@ghds/tokens'`), so there is no runtime `var()` cascade to override — a React Native theme change means supplying different token values in JS, not editing CSS custom properties.
