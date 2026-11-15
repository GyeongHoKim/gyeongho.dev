# Token Usage

Every GHDS component reads its colors, spacing, typography, radii, and other design values from `@ghds/tokens`. Tokens come in three tiers — `ref` (raw values), `sys` (semantic roles), and `comp` (component-specific overrides). As a consumer, think of these as three layers you can reference in your own styles, not as files you edit — you only ever consume `sys.*` and `comp.*`.

## Consume `sys.*`/`comp.*`, never `ref.*` or hardcoded values

`ref` tokens are raw, unthemed primitives. Referencing them directly (or hardcoding a color/spacing value yourself) bypasses GHDS's semantic layer — your value won't respond to theme/dark-mode changes, and it loses the WCAG contrast guarantee that only holds for `sys.color.*`/`comp.*` pairings.

```css
/* Incorrect — hardcoded value, bypasses the contrast-validated token system */
.my-button {
  background-color: #0066cc;
  color: #ffffff;
}
```

```css
/* Correct — consumes a sys token, contrast-guaranteed against its paired text/bg */
.my-button {
  background-color: var(--sys-color-bg-primary);
  color: var(--sys-color-text-onPrimary);
}
```

## Import the token stylesheet once, at app entry

React and Web Components components read their values from CSS custom properties. Without importing the stylesheet, every color/spacing value silently falls back to unset.

```tsx
// Incorrect — no token stylesheet imported anywhere; every token-driven value
// (color, spacing, radius) falls back to unset
import { Button } from '@ghds/react/button';

function Page() {
  return <Button variant="primary">Save</Button>;
}
```

```tsx
// Correct — import once, at the app's root/entry file
import '@ghds/tokens/css';
import { Button } from '@ghds/react/button';

function Page() {
  return <Button variant="primary">Save</Button>;
}
```

## React Native: tokens are a JS object, not CSS

React Native has no stylesheet to import. Import the `tokens` object directly and reference the same `sys.*`/`comp.*` paths as JS property access:

```tsx
import { tokens } from '@ghds/tokens';
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  button: {
    backgroundColor: tokens.sys.color.bg.primary,
    paddingHorizontal: tokens.sys.spacing.component.md,
  },
});
```

The rule is unchanged across platforms: reference `sys`/`comp`, never `ref`, never a literal value.

## Prefer `comp.*` over `sys.*` when a component-specific token exists

Some components — like focus rings — have their own dedicated `comp.*` token rather than a general `sys.*` one. Removing an outline without replacing it with the component's focus-ring token breaks visible-focus accessibility.

```css
/* Incorrect — removes the focus ring without replacing it */
.my-input:focus {
  outline: none;
}
```

```css
/* Correct — replaces it with the component's own focus-ring token */
.my-input:focus {
  outline: none;
  box-shadow: 0 0 0 2px var(--comp-input-focus-ring);
}
```
