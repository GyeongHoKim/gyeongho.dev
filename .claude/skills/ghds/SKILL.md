---
name: ghds
description: Generate correct, accessible UI code that consumes the GHDS design system (@ghds/react, @ghds/web-components, @ghds/react-native, @ghds/tokens). Use whenever writing or reviewing code that imports from any @ghds/* package.
license: MIT
---

# GHDS

GHDS (GH Design System) is a token-driven, cross-platform design system shipped as four npm packages: `@ghds/react`, `@ghds/web-components` (framework-agnostic Lit custom elements), `@ghds/react-native`, and `@ghds/tokens` (the shared design values all three consume). The same visual language is implemented three times — once per platform — so always check which platform you're generating code for before reaching for a prop name.

Core rule, before anything else: **consume `sys.*`/`comp.*` design tokens, never hardcode colors/spacing/typography and never reference `ref.*` tokens directly.** See [rules/tokens.md](rules/tokens.md).

## Installation

```bash
# React
pnpm add @ghds/react @ghds/tokens

# Framework-agnostic (Lit web components)
pnpm add @ghds/web-components @ghds/tokens

# React Native (inferred — not published on the getting-started page, but the
# package is real and used throughout the pattern docs)
pnpm add @ghds/react-native @ghds/tokens
```

Every React/Web Components value reads from CSS custom properties — import the token stylesheet once, at your app's entry point:

```ts
import '@ghds/tokens/css';
```

React Native has no stylesheet to import; tokens resolve as a plain JS object instead:

```tsx
import { tokens } from '@ghds/tokens';
// tokens.sys.color.bg.primary, tokens.sys.spacing.component.md, ...
```

## Critical Rules

Each rule below is enforced — follow the link for the full Incorrect/Correct code pairs.

- **[Token usage](rules/tokens.md)** — always consume `sys.*`/`comp.*` tokens, never `ref.*` directly or a hardcoded value.
- **[Theming](rules/theming.md)** — rebrand by overriding `--sys-*` CSS custom properties (they cascade to every component), never by hardcoding brand colors or forking components; always cover dark mode.
- **[Accessibility](rules/accessibility.md)** — ARIA patterns, keyboard interaction, and focus management per component.
- **[Composition](rules/composition.md)** — `FormField` wraps exactly one control; choosing between Toast/Alert/Modal and Skeleton/Spinner; debounce search inputs.
- **[Platform differences](rules/platform-differences.md)** — prop and event naming diverges across React / Web Components / React Native. Never port a prop name from one platform to another without checking this file.

## Key Patterns

```tsx
// Token CSS import — once, at app entry
import '@ghds/tokens/css';
```

```tsx
// FormField composition — wraps exactly one control, wires label/error/aria
<FormField label="Email" helperText="We'll never share this." error={emailError}>
  <Input type="email" />
</FormField>
```

```
// Feedback selection at a glance (full decision tree in rules/composition.md)
User-initiated action, stays on screen        → Alert (inline, persistent)
User-initiated action, then navigates away    → Toast (auto-dismiss)
System event needing a decision               → Modal (interrupts, traps focus)
System event, informational only              → Toast (auto-dismiss)
```

```tsx
// React Native change events — NOT onChange (see rules/platform-differences.md)
<Checkbox onCheckedChange={(checked) => setValue(checked)} />
<Input onChangeText={(text) => setValue(text)} />
```

## Component Selection

All components below exist on all three platforms (`@ghds/react`, `@ghds/web-components`, `@ghds/react-native`). The **Notes** column flags the single most common cross-platform gotcha; the full, source-verified divergence list is in [rules/platform-differences.md](rules/platform-differences.md). "WC" = Web Components, "RN" = React Native.

### Forms & inputs

| Need | Component | Notes |
|---|---|---|
| Clickable action trigger | `Button` | `variant`: `primary`/`danger`/`neutral` on React & WC; RN omits `neutral` and takes `label: string` only (no children) |
| Group related buttons | `ButtonGroup` | RN `orientation: 'row'\|'column'` vs React/WC `'horizontal'\|'vertical'` |
| Single-line text entry | `Input` | Pair with `FormField`; RN change event is `onChangeText`, not `onChange` |
| Input with inline addons | `InputGroup` | Wraps an input + prefix/suffix addons in one box; RN addons are icon/text only |
| One-time-code entry | `InputOTP` | WC dispatches `gh-change`/`gh-complete` events (no callback) and is controlled-only (no `defaultValue`) |
| Multi-line text entry | `Textarea` | Pair with `FormField` |
| Dropdown selection | `Select` | Pair with `FormField` |
| Native platform select | `NativeSelect` | React `<option>` children + `onChange` + `error`; RN `items[]` + `selectedValue`/`onValueChange`; WC slotted `<select>` + `invalid` (no `error`) |
| Searchable single-select | `Combobox` | React is an inline input+listbox; RN is a modal picker; empty-text prop `emptyMessage` (React) vs `emptyText` (RN) |
| Binary toggle (form-style) | `Checkbox` | RN: `onCheckedChange`, not `onChange` |
| Group of checkboxes | `CheckboxGroup` | React/RN share `value: string[]`+`onValueChange`; WC is presentational (each `gh-checkbox` self-manages) |
| Single choice from a set | `Radio` | Group with `RadioGroup` |
| Mutually-exclusive radios | `RadioGroup` | WC has no shared `value`/`onValueChange` (children self-manage); React shares `name` via context |
| Binary toggle (on/off setting) | `Switch` | RN: `onCheckedChange`, not `onChange` |
| Numeric range input | `Slider` | No arrow-key stepping on RN |
| Two-state pressed button | `Toggle` | RN requires `label`; WC is form-associated, fires `change` (no `onPressedChange`/`defaultPressed`) |
| Group of toggles (single/multi) | `ToggleGroup` | React types `value` by mode (`string`\|`string[]`); RN/WC always `string[]`; RN `orientation: 'row'\|'column'` |
| Date field + calendar | `DatePicker` | WC `value` is an ISO string + `change` event; React/RN use `Date` + `onChange` |
| Month-grid date selection | `Calendar` | Select cb differs: React `onSelect(Date)`, RN `onChange(Date)`, WC `select` event (ISO string) |
| Form label | `Label` | Association prop: React `htmlFor`, RN `nativeID`, WC `for` |
| Label + helper + error wrapper | `FormField` | Wraps exactly one control — see [composition.md](rules/composition.md) |

### Overlays & dialogs

| Need | Component | Notes |
|---|---|---|
| Blocking dialog requiring a decision | `Modal` | `title` (React/RN) vs `heading` (WC) |
| Confirm/cancel dialog | `AlertDialog` | WC uses `heading` not `title`, and `variant: 'default'\|'danger'` vs React/RN `destructive` boolean |
| Bottom drawer / tray | `Drawer` | WC `heading` not `title`; RN has no `closeOnScrimClick` |
| Edge-anchored side panel | `Sheet` | `side`: left/right/top/bottom; WC `heading` not `title`; RN has no `closeOnScrimClick` |
| Click-triggered floating panel | `Popover` | RN requires `triggerLabel` and has no `placement`; WC dispatches no open-change event |
| Hover-reveal card | `HoverCard` | RN has no hover — opens on long-press and requires `triggerLabel` |
| Contextual popup hint | `Tooltip` | `role="tooltip"`, `aria-describedby` |
| Dropdown/contextual action list | `Menu` | Arrow-key navigation, Escape dismiss |
| Horizontal menu bar | `Menubar` | RN `onSelect(menuValue, itemValue)` (two args); WC `menu-select` event |
| Right-click / long-press menu | `ContextMenu` | React opens on right-click of `children`; RN long-press + `triggerLabel`; danger flag `danger`(React)/`destructive`(RN)/`dangerValues[]`(WC) |
| Command palette | `Command` | React `groups[]` + a separate `CommandDialog`; RN/WC take flat `items[]` and are themselves modal |

### Navigation

| Need | Component | Notes |
|---|---|---|
| Multi-step or grouped navigation | `Tabs` | No roving-tabindex arrow nav on RN |
| Page/section location trail | `Breadcrumb` | — |
| Paged navigation control | `Pagination` | — |
| Top-level nav with dropdown links | `NavigationMenu` | React/WC are href-based (`<a>`); RN is selection-callback (`value`+`onSelect`, no `href`) |
| App navigation sidebar | `Sidebar` | React/RN data-driven (`sections`); WC slot-based; RN has no collapse; section heading prop React `.heading` vs RN `.title` |

### Feedback & status

| Need | Component | Notes |
|---|---|---|
| Transient, non-blocking notification | `Toast` | Auto-dismiss ~5s |
| Persistent inline status message | `Alert` | `role="status"` default, `role="alert"` for `danger` |
| Sequential step progress | `Progress` | Combine with `Tabs` for multi-step forms |
| First-paint loading placeholder | `Skeleton` | Use when nothing is on screen yet |
| Subsequent/inline loading indicator | `Spinner` | Use when existing content stays visible |
| Status/category label | `Badge` | Combine with a dismiss action for filter chips |
| Empty-state placeholder | `Empty` | WC `heading` not `title`; action slot React `action` / RN `children` / WC `actions` |

### Layout & containers

| Need | Component | Notes |
|---|---|---|
| Card-style content container | `Card` | React: no default role, you supply one |
| Collapsible sections | `Accordion` | — |
| Single disclosure toggle | `Collapsible` | WC is `open` + `toggle` event (no `defaultOpen`/controlled split) |
| Divider between content | `Separator` | `decorative` defaults to `true` on RN vs `false` on React/WC — changes a11y exposure |
| Bounded scroll viewport | `ScrollArea` | `orientation`: vertical/horizontal/both; RN cannot theme the native scrollbar |
| Fixed-ratio box | `AspectRatio` | Constrain content to a width/height `ratio` |
| Draggable split panels | `Resizable` | Compound Panel/Handle/Group; no arrow-key resize on RN (touch-drag only) |
| Scroll-snap carousel | `Carousel` | RN adds a `CarouselIndicators` sub-component; WC renders its own controls + dots |
| Propagate text direction | `Direction` | React/RN `DirectionProvider` + `useDirection()`; WC `<gh-direction dir>`; RN default derives from `I18nManager.isRTL` |

### Data display

| Need | Component | Notes |
|---|---|---|
| Tabular data display | `Table` | `sort`/`onSort` props for sortable columns |
| Bar/line chart | `Chart` | Data shape differs: React `series`+`categories`, WC `series`+`labels`, RN single-series `data[]` |
| User identity image | `Avatar` | — |
| Icon by name | `Icon` | RN needs an explicit `color` prop (no CSS `currentColor`); React/WC inherit `currentColor` |
| Keyboard-key hint | `Kbd` | — |
| Flexible list-row primitive | `Item` | RN adds `onPress` (makes the row a button); React/WC have no press handling |
| Highlighter over text | `Marker` | `variant`: default/success/info/danger |

### Chat / messaging

| Need | Component | Notes |
|---|---|---|
| Chat bubble | `Bubble` | `variant`: received/sent |
| Chat message row | `Message` | `side`: received/sent |
| Auto-stick-to-bottom chat log | `MessageScroller` | `stickToBottom`; WC also exposes an imperative `scrollToBottom()` |
| File attachment chip | `Attachment` | React/RN use `onRemove` + `removeLabel`; WC uses a `removable` boolean + `gh-remove` event |

## Reference

- [rules/tokens.md](rules/tokens.md) — token consumption rules
- [rules/theming.md](rules/theming.md) — rebranding/customization via CSS-variable overrides
- [rules/accessibility.md](rules/accessibility.md) — ARIA, keyboard, focus management
- [rules/composition.md](rules/composition.md) — component composition patterns
- [rules/platform-differences.md](rules/platform-differences.md) — React / Web Components / React Native API differences
- Full per-component prop tables and live demos: https://gyeonghokim.github.io/gyeongho-design-system/components/
