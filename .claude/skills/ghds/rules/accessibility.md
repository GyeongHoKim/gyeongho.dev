# Accessibility

## Keyboard Interaction

| Keys | Action |
| --- | --- |
| `Tab` | Move focus to the next focusable element in document order. |
| `Shift + Tab` | Move focus to the previous focusable element. |
| `Enter / Space` | Activate a focused Button. |
| `Escape` | Close an open Modal (dismisses the dialog and restores focus to the trigger). Also dismisses Tooltip and Menu. |
| `↑ ↓ ← →` | Navigate items within an open Menu (arrow keys), or cycle through Tabs (left/right arrows). |

Most components (`Button`, `Card`, `Input`, `Alert`, `Badge`, `Avatar`, `Spinner`, `Progress`, `Skeleton`, `Table`) rely entirely on native browser keyboard handling — you don't need to add `onKeyDown`/`tabIndex` logic yourself. Overlay components (`Modal`, `Menu`, `Tooltip`) add their own bindings for dismissal and navigation. See `platform-differences.md` for where React Native's keyboard support falls short of this table.

## ARIA Patterns by Component

| Component | Pattern |
| --- | --- |
| `Button` | Native `<button>` role (or `aria-disabled` on the `asChild` path — see Focus Management below). |
| `Card` | No role by default on React — you supply one. Web Components/React Native auto-expose `role="group"`/`accessibilityRole="summary"` when a `label` is given. |
| `Input` | `aria-invalid` + `aria-describedby` (pointing at a `role="alert"` error message) wired automatically when used inside `FormField` with an `error` set. |
| `Modal` | `role="dialog"` + `aria-modal="true"`, title wired via `aria-labelledby`. |
| `Alert` | `role="status"` by default, `role="alert"` for the `danger` variant (assertive). |
| `Toast` | `role="status"` (polite) for info/success/warning; `role="alert"` (assertive) for `danger`. |
| `Tooltip` | `role="tooltip"`, trigger linked via `aria-describedby`. |
| `Menu` | `role="menu"` with `role="menuitem"` on items; arrow-key navigation, Escape dismiss. |

**Use `FormField` for error wiring instead of hand-rolling it.** `FormField` automatically wires `aria-describedby`/`aria-invalid` and gives the error text `role="alert"` — a hand-rolled error span next to an `Input` does not connect to it at all.

```tsx
// Incorrect — visually shows an error, but nothing wires it to the input for
// screen readers; aria-invalid/aria-describedby are never set
<Input error={hasError} />
{hasError && <span className="error-text">Invalid email</span>}
```

```tsx
// Correct — FormField wires aria-invalid + aria-describedby + role="alert"
// automatically
<FormField label="Email" error={hasError ? 'Invalid email' : undefined}>
  <Input type="email" />
</FormField>
```

## Focus Management

- Always keep a visible focus ring — see `tokens.md`'s `comp.*.focus.ring` rule; never remove `outline` without replacing it.
- A native `disabled` attribute removes an element from the tab order entirely. `Button`'s `asChild` path only sets `aria-disabled`, which does **not** remove it from the tab order — if you disable an `asChild` button, you must also prevent activation yourself.

```tsx
// Incorrect — assumes aria-disabled removes the element from the tab order (it
// doesn't); a keyboard user can still Tab to and activate this "disabled" link
<Button asChild disabled>
  <a href="/checkout">Checkout</a>
</Button>
```

```tsx
// Correct — when using asChild, also guard activation manually, since
// aria-disabled alone does not block Tab focus or Enter/Space activation
<Button asChild aria-disabled={isDisabled}>
  <a
    href="/checkout"
    onClick={(e) => { if (isDisabled) e.preventDefault(); }}
    tabIndex={isDisabled ? -1 : undefined}
  >
    Checkout
  </a>
</Button>
```

- `Modal` and `Menu` trap focus while open and restore it to the triggering element on close.
- `Toast` and `Tooltip` do **not** trap focus — they're transient/supplementary, so don't rely on them for a keyboard-only critical flow.

## Color Contrast

Every `sys.color.*` text/background pairing is validated at build time against WCAG 2.1 AA (4.5:1 for normal text, 3:1 for large text/icons/borders). This guarantee only holds when you consume `sys.*`/`comp.*` tokens — see `tokens.md` for the consumption rule this depends on.
