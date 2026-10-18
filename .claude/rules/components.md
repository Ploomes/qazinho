# Components — the layered anatomy

QAzinho has no design system package. Every shared visual component lives in
`src/shared/components/`, split by **atomic design**:

```
src/shared/components/
├── atoms/        Button, Chip, StatusPill, Input, IconButton, Meter, Kbd, Logo, Intern, Markdown,
│                 Wordmark, Tag
├── molecules/    TabBar, SidebarRow, CountTile, TargetCard, MetaGrid
├── organisms/    Titlebar, Sidebar, Composer, PlanCase, DevicePanel, ResourcePopover, StepsPopup
└── templates/    AppShell, ModalFrame
```

- **Atom**: cannot be split without stopping being a thing of its own.
- **Molecule**: a handful of atoms with one job.
- **Organism**: a whole region of the screen.
- **Template**: the arrangement of regions, with no content of its own.
- A component used by **one screen only** lives in that screen's `components/`, not here.
- A component owned by a domain lives in `src/modules/<Domain>/components/`.

## The anatomy

Every component and every page, without exception:

```
<Name>/
├── index.tsx                     view — composition and JSX, nothing else
├── styles.css                    the component's stylesheet
├── constants/                    one value per file, named
├── types/                        one type per file, named after the type
├── hooks/
│   └── use<Name>ViewModel/
│       ├── index.ts              state, handlers, derivations
│       └── __tests__/            the view model's test
└── components/                   local subcomponents, same anatomy
```

## The view has no logic

`index.tsx` does **composition and JSX**, and nothing else. It declares no function, derives no
value, holds no state, and computes no condition beyond rendering what the view model resolved.

```tsx
// ❌ logic in the view
const isActive = tab === current;
function onTabClick(name: string) {}

// ✅ the view model resolves, the view consumes
const { tabs, isActive, onTabClick } = useTabBarViewModel(props);
```

## Every component has a view model

Even when it looks like too little. That is where the rule ("does not call `onClick` when
disabled") becomes testable without mounting a tree.

The view model takes the component's props and returns only what the view consumes.

```ts
export const useTabBarViewModel = (props: ITabBarProps) => {
  const { tabs, current, onChange } = props;
  return { items, onTabClick };
};
```

**Exception: a purely declarative component.** No `useState`, no `useEffect`, no `useRef`, no
handler and no derivation — only JSX built from constants. An empty view model with an empty
test is worse than no view model. The moment any of those appears, the view model is mandatory.

## Do not hand-memoize

The React Compiler memoizes for you. A `useCallback` or `useMemo` whose dependency comes out of a
store selector makes it **skip the whole component** (`react-hooks/preserve-manual-memoization`
fires). Write the plain function and let the compiler work.

## Every view model has a test

`hooks/use<Name>ViewModel/__tests__/use<Name>ViewModel.test.ts`. One `describe` per exposed
function, and the cases that matter: the happy path, the path that must **not** happen, and the
edge. See `testing.md`.

## Styles

- One `styles.css` per component, imported by its `index.tsx`.
- Class names are BEM over the component's kebab name: `.status-pill`,
  `.status-pill__icon`, `.status-pill--failed`.
- **No inline `style`**, except a value the view model computed and CSS cannot know (a dragged
  card's offset, the device panel's width). It goes in as a custom property:
  `style={{ '--device-width': widthPx }}`.
- Colour, spacing, radius, font and duration come from tokens — see `design-tokens.md`.

## Props

- One props object, typed `I<Name>Props`, in `types/I<Name>Props.ts`.
- A component that takes a callback names it `onSomething`, and the view model wraps it.
