# Platform Differences

GHDS ships the same design as three separate implementations — `@ghds/react`, `@ghds/web-components` (Lit, `gh-*` custom elements), and `@ghds/react-native`. They are **not** a single API with three renderers; prop names, event shapes, and even the supported variant set diverge in specific, verified ways. Do not port a prop name from one platform to another without checking this file first.

## Contents

- Dialog family accessible title: `title` vs `heading`
- Change events: three different shapes
- Button content: children vs `label`-only
- Button `variant`: React Native has no `'neutral'`
- React-Native-only props
- Web-Components-only: native form participation
- Selection groups: Web Components has no shared `value`
- `orientation` union: React Native uses `'row' | 'column'`
- `Separator` `decorative` default differs
- React Native touch adaptations: no hover / no right-click
- Accessibility prop gaps on React Native

## Dialog family accessible title: `title` vs `heading`

React and React Native use `title` for a dialog's accessible heading. Web Components uses `heading` for the identical concept. This applies to the **entire dialog family**, not just `Modal`: `Modal`, `AlertDialog`, `Drawer`, and `Sheet` all take `title` on React/React Native and `heading` on Web Components. (`Empty` — an empty-state placeholder, not a dialog — follows the same `title`→`heading` rename in Web Components.)

```tsx
// React / React Native
<Modal title="Delete item?" open={open} onClose={onClose}>
  ...
</Modal>
```

```html
<!-- Web Components — the prop is `heading`, not `title` -->
<gh-modal heading="Delete item?" open>
  ...
</gh-modal>
```

**Gotcha:** `title` is also a native HTML global attribute (hover tooltip). Setting `title="Delete item?"` on `<gh-modal>` does not error — it silently renders a browser tooltip instead of wiring the dialog's accessible name. This is a wrong-behavior trap, not a compile-time catch.

**Related:** `AlertDialog` also diverges on its variant model — React/React Native use a `destructive` boolean, while Web Components uses `variant: 'default' | 'danger'`. And `Drawer`/`Sheet` expose `closeOnScrimClick` on React and Web Components but **not** on React Native.

## Change events: three different shapes

- **React** — native `onChange(event)`; read `event.target.value` / `event.target.checked`.
- **Web Components** — no callback prop at all; the element dispatches a native DOM `change`/`input` event, so the consumer must `addEventListener`.
- **React Native** — differently-named callbacks that receive a bare value, not an event: `onCheckedChange?: (checked: boolean) => void` (`Checkbox`, `Switch`) and `onChangeText?: (text: string) => void` (`Input` — note the name, it is **not** `onChange`).

```tsx
// React
<Checkbox onChange={(e) => setChecked(e.target.checked)} />
<Input onChange={(e) => setValue(e.target.value)} />
```

```html
<!-- Web Components -->
<gh-checkbox id="my-checkbox"></gh-checkbox>
<script>
  document.getElementById('my-checkbox').addEventListener('change', (e) => {
    console.log(e.target.checked);
  });
</script>
```

```tsx
// React Native — NOT onChange
<Checkbox onCheckedChange={(checked) => setChecked(checked)} />
<Switch onCheckedChange={(checked) => setChecked(checked)} />
<Input onChangeText={(text) => setValue(text)} />
```

## Button content: children vs `label`-only

React and Web Components accept arbitrary children/slotted content. React Native's `Button` only accepts a `label: string` prop — there is no children slot, so rich or composed content (an icon plus text, for example) is not possible.

```tsx
// React / Web Components — arbitrary children
<Button variant="primary"><Icon name="save" /> Save changes</Button>
```

```tsx
// Incorrect on React Native — Button has no children prop
<Button><Icon name="save" /> Save changes</Button>

// Correct on React Native — label is a plain string
<Button label="Save changes" variant="primary" />
```

## Button `variant`: React Native has no `'neutral'`

React and Web Components support `'primary' | 'danger' | 'neutral'`. React Native's `ButtonVariant` is `'primary' | 'danger'` only — `'neutral'` does not exist there.

```tsx
// React / Web Components — three variants
<Button variant="neutral">Cancel</Button>
```

```tsx
// Incorrect on React Native — 'neutral' is not in the RN ButtonVariant union;
// this is a type error, not a silent fallback
<Button label="Cancel" variant="neutral" />

// Correct on React Native — only 'primary' | 'danger' exist; use 'primary' with
// custom styling, or a plain Pressable, for a neutral/tertiary action
<Button label="Cancel" variant="primary" />
```

## React-Native-only props

`testID` and `accessibilityHint` exist only on React Native — they have no equivalent prop on React or Web Components. When porting a component's usage from React/Web Components to React Native, add them where useful for testing/accessibility; when porting the other direction, drop them (they don't exist elsewhere and TypeScript will reject them on React/Web Components).

## Web-Components-only: native form participation

`Button`, `Checkbox`, and `Switch` on Web Components participate in native `<form>` submission and reset via `ElementInternals`/form-association — a real `<form>` submit or reset affects them automatically. React has no equivalent (plain DOM form semantics apply instead — you wire submission yourself), and React Native has no native `<form>` concept at all.

## Selection groups: Web Components has no shared `value`

`CheckboxGroup` and `RadioGroup` manage a shared selection on React and React Native — you read/write the group's state via `value` (a `string[]` for `CheckboxGroup`, a `string` for `RadioGroup`) plus `onValueChange`. **Web Components' group elements do not have `value`/`onValueChange` at all** — they are presentational (label, layout, disabled), and each child `gh-checkbox`/`gh-radio` owns its own `checked`/`value`. So on Web Components you wire state per-child and listen to each child's DOM event; there is no group-level callback.

```tsx
// React / React Native — group owns the shared value
<CheckboxGroup value={selected} onValueChange={setSelected}>
  <Checkbox value="a" /> <Checkbox value="b" />
</CheckboxGroup>
```

```html
<!-- Web Components — no group value; each child self-manages -->
<gh-checkbox-group label="Pick some">
  <gh-checkbox name="a"></gh-checkbox>
  <gh-checkbox name="b"></gh-checkbox>
</gh-checkbox-group>
```

## `orientation` union: React Native uses `'row' | 'column'`

`ButtonGroup` and `ToggleGroup` accept an `orientation`, but the allowed string literals differ. React and Web Components use `'horizontal' | 'vertical'`; **React Native uses `'row' | 'column'`** (matching its flexbox naming). Porting `orientation="horizontal"` to React Native is a type error, not a silent fallback.

Relatedly, `ToggleGroup`'s `value` typing differs: React types it by mode via a discriminated union (`string` when `type="single"`, `string[]` when `type="multiple"`), whereas React Native and Web Components always use `string[]` even in single-select mode.

## `Separator` `decorative` default differs

`Separator` takes a `decorative` boolean, but its default is not the same everywhere: **React Native defaults `decorative` to `true`** (the divider is hidden from assistive tech), while React and Web Components default it to `false` (exposed as `role="separator"`/`aria-orientation`). If a separator is semantically meaningful on React Native, set `decorative={false}` explicitly.

## React Native touch adaptations: no hover / no right-click

Components that open on hover or right-click on the web have no such gesture on React Native, so their RN API differs: `HoverCard` opens on **long-press**, `ContextMenu` opens on **long-press**, `Popover` opens on **press**, and `NavigationMenu` opens on **tap**. Each of these RN components therefore requires a `triggerLabel` (for the accessible pressable) and drops hover-specific props — `placement` and the `openDelay`/`closeDelay` family exist on React but not on React Native.

## Accessibility prop gaps on React Native

Three distinct situations — do not treat them as equivalent:

- **`accessibilityValue` / `accessibilityState`** — these nested RN accessibility objects are not forwarded to the DOM by react-native-web. You do not need to work around this yourself: GHDS's React Native components already set the flat ARIA equivalent (`aria-checked`, `aria-valuenow`, etc.) internally alongside them, so the ARIA output a screen reader sees is correct in practice. This is mentioned only so you understand why passing these props yourself has no additional effect.
- **`onAccessibilityAction`** — genuinely unsupported when a React Native app is rendered via react-native-web. It's currently exposed only on `Slider`. If you need a custom accessibility action on `Slider` in a web-rendered React Native context, there is no supported workaround today.
- **Keyboard interaction (`onKeyDown`-based)** — not implemented for React Native at all. This is a real feature gap, not a forwarding issue: `Slider` has no arrow-key stepping on React Native, and `Tabs` has no roving-tabindex arrow-key navigation on React Native. If your product needs full keyboard parity between the web platforms and React Native, plan around this explicitly.
