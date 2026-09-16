# Comments

**As lean as possible.** One line or nothing.

## JSDoc: allowed, short

One line on a class, method, function or type. It says what **that** thing is, or why it exists.

**Never inside an interface body.** A member comment breaks the shape you are trying to read. If a
field needs explaining, the explanation belongs in the interface's own one-line JSDoc. If it fits
nowhere, the field name is wrong.

```ts
/** What the preload exposes to the page as `window.gocrash`. Data and purposeful functions only. */
export interface IGocrashApi {
  platform: Platform;
}
```

**Paragraph blocks are forbidden.** If it does not fit on one line, what is left over is decision
context: it goes to the README or a commit message, not into the file.

The test: if the text stays true when pasted onto another thing of the same kind, it says
nothing. `"Checks the navigation"` fits any guard; `"A hash change on the packaged page is still
the app; any other file on disk is not"` fits this one.

A good name needs no JSDoc.

## Comments inside a function

**Would deleting this make someone break the code?** If not, delete it. Four kinds get through:

| Kind                           | Example                                                                           |
| ------------------------------ | --------------------------------------------------------------------------------- |
| Looks like a bug and is not    | comparing `pathname` for a `file:` page, because every `file:` origin is `"null"` |
| Deliberate absence             | `window-all-closed` not quitting on macOS, because apps stay in the dock          |
| Invisible trap                 | a sandboxed preload can `require` only `electron` and a few polyfills             |
| Compatibility with the outside | the CSP allowing inline styles, because React's `style` prop writes them          |

Not allowed: narrating the next block, repeating the function name, explaining the pattern instead
of the instance.

## A comment carrying third-party behaviour

A rule that came from Electron, Chromium, Android or Xcode **says where it came from**.

```ts
// Electron: a sandboxed preload cannot require anything but `electron`.
```

## Exception

`TODO(<feature>):` marking work that already has a contract and no implementation. When a path is
unimplemented, **an explicit error beats a silent `TODO`**: say what to do in the message and let
it throw.

When in doubt, do not comment.
