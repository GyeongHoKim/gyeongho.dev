# Composition Patterns

GHDS components are deliberately small — most real UI is a *pattern*, a recipe combining several components. These are the recurring recipes and the decisions behind them.

## Contents

- FormField wraps exactly one control
- Validate on blur + submit, not on every keystroke
- Choosing between Toast, Alert, and Modal
- Choosing between Skeleton and Spinner
- Debounce search inputs

## FormField wraps exactly one control

`FormField` composes a label, helper text, and error message around a **single** form control, wiring `id`/`aria-describedby`/`aria-invalid` to that one control. Wrapping more than one control breaks that wiring — only one of them ends up connected.

```tsx
// Incorrect — FormField composes around exactly one control; wrapping two
// breaks its id/aria-describedby wiring
<FormField label="Name">
  <Input placeholder="First" />
  <Input placeholder="Last" />
</FormField>
```

```tsx
// Correct — one FormField per control
<FormField label="First name">
  <Input />
</FormField>
<FormField label="Last name">
  <Input />
</FormField>
```

## Validate on blur + submit, not on every keystroke

Validating on every keystroke is noisy and interrupts typing. Validate a field when it loses focus, and validate the whole form again on submit.

```tsx
// Incorrect — validates on every keystroke
<Input onChange={(e) => { setValue(e.target.value); validate(e.target.value); }} />
```

```tsx
// Correct — validate on blur (per-field), and again on submit (whole form)
<Input
  value={value}
  onChange={(e) => setValue(e.target.value)}
  onBlur={() => validate(value)}
/>
```

Also: mark required fields with an asterisk or "(required)" text, not color alone. For forms with more than ~5 fields (or cross-field validation), prefer a summary `Alert variant="danger"` at the top over per-field inline errors alone.

## Choosing between Toast, Alert, and Modal

Decision tree:
- User-initiated action, result stays on screen → **Alert** (inline, persistent).
- User-initiated action, then the user navigates away → **Toast** (auto-dismiss).
- System event that needs a decision → **Modal** (interrupts, traps focus).
- System event, informational only → **Toast** (auto-dismiss).

| | Toast | Alert | Modal |
|---|---|---|---|
| Position | Fixed, bottom-right | Inline, in layout | Centered overlay with scrim |
| Persistence | Auto-dismiss (default 5s) | Stays until dismissed | Stays until explicit close |
| Interrupts | No | No | Yes (traps focus, locks scroll) |
| Requires action | No | Optional dismiss | Yes (at minimum "OK"/"Cancel") |
| Use for | "Saved", "Copied" | Form errors, status banners | Confirmations, detail views |
| Stacking | Multiple can stack | One per context | One at a time — never nested |

```tsx
// Incorrect — Modal for a simple success message; too heavy, interrupts the
// user and forces a dismiss action for something that needed none
<Modal open={saved} title="Success" onClose={() => setSaved(false)}>
  Your changes were saved.
</Modal>
```

```tsx
// Correct — Toast for a transient, non-blocking confirmation
<Toast variant="success" open={saved} onClose={() => setSaved(false)}>
  Your changes were saved.
</Toast>
```

Don't rely on color alone to convey severity — always pair the color token with an icon and text.

## Choosing between Skeleton and Spinner

| State | Trigger | Component |
|---|---|---|
| Loading (first paint) | Page/view mounts, fetch starts, nothing on screen yet | `Skeleton` |
| Loading (subsequent) | Filter change, pagination, refresh — existing content stays visible | `Spinner` |
| Empty | Zero results | Message + `Button` for a next action |
| Error | Network/server failure | `Alert variant="danger"` + retry `Button` |

Rule of thumb: is there existing content on screen? No → `Skeleton`. Yes → `Spinner`.

```tsx
// Incorrect — Spinner on first paint blanks the whole layout unnecessarily,
// when there's no existing content to preserve context around
function ProductList() {
  if (loading) return <Spinner />;
  return <List items={products} />;
}
```

```tsx
// Correct — Skeleton on first paint (mimics eventual layout); Spinner only for
// subsequent loads where existing content stays visible
function ProductList() {
  if (isFirstLoad) return <Skeleton />;
  return (
    <>
      {isRefetching && <Spinner />}
      <List items={products} />
    </>
  );
}
```

Use a live region (`role="status"`) to announce result counts (e.g. "Showing 12 of 45 items") — a `Spinner` alone isn't announced to screen readers.

## Debounce search inputs

Firing a search request on every keystroke hammers the backend unnecessarily.

```tsx
// Incorrect — fires a network request on every keystroke
<Input onChange={(e) => search(e.target.value)} />
```

```tsx
// Correct — debounce 300-400ms before firing
const debouncedSearch = useMemo(() => debounce(search, 350), []);
<Input onChange={(e) => debouncedSearch(e.target.value)} />
```
