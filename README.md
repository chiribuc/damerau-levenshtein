# Damerau-Levenshtein

[![npm version](https://img.shields.io/npm/v/@crob/damerau-levenshtein.svg)](https://www.npmjs.com/package/@crob/damerau-levenshtein)
[![CI](https://github.com/chiribuc/damerau-levenshtein/actions/workflows/ci.yml/badge.svg)](https://github.com/chiribuc/damerau-levenshtein/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/@crob/damerau-levenshtein.svg)](./LICENSE)

The Damerau-Levenshtein edit distance: the cost of turning one string into another using
insertions, removals, substitutions, and transpositions of adjacent characters.

- **Dependency-free** and tiny — about 1.2 kB gzipped.
- **TypeScript-first**, with types for every cost callback.
- **Configurable costs** per operation, as flat numbers or per-character functions.
- **Unicode-aware**: compares code points, so emoji count as one character.
- **Linear memory**: O(min(n, m)), so long strings stay cheap.
- Ships **ESM, CommonJS and UMD** builds.

## Installation

```sh
npm i @crob/damerau-levenshtein
```

## Usage

```ts
import { DamerauLevenshtein } from "@crob/damerau-levenshtein";

const dl = new DamerauLevenshtein();

dl.distance("kitten", "sitting"); // 3
dl.distance("ab", "ba"); // 1 — one transposition
```

Comparing a single pair? Use the `distance` helper instead:

```ts
import { distance } from "@crob/damerau-levenshtein";

distance("kitten", "sitting"); // 3
distance("ab", "ba", { transpositions: false }); // 2
```

The class is also available as a default export, and the package works from CommonJS:

```js
const { DamerauLevenshtein, distance } = require("@crob/damerau-levenshtein");
```

In the browser, the UMD build exposes everything on `window.DamerauLevenshtein`:

```html
<script src="https://unpkg.com/@crob/damerau-levenshtein"></script>
<script>
  const { DamerauLevenshtein } = window.DamerauLevenshtein;
  console.log(new DamerauLevenshtein().distance("hello", "world")); // 4
</script>
```

## API

### `new DamerauLevenshtein(options?)`

Creates a reusable calculator. Options are validated once, at construction, so build the
instance once and reuse it across comparisons.

| Option           | Type                                      | Default | Description                                               |
| ---------------- | ----------------------------------------- | ------- | --------------------------------------------------------- |
| `insert`         | `number \| (char) => number`              | `1`     | Cost of inserting a character from the target.            |
| `remove`         | `number \| (char) => number`              | `1`     | Cost of removing a character from the source.             |
| `substitute`     | `number \| (from, to) => number`          | `1`     | Cost of replacing one character with another.             |
| `transpose`      | `number \| (backward, forward) => number` | `1`     | Cost of swapping two adjacent characters.                 |
| `transpositions` | `boolean`                                 | `true`  | Set to `false` to compute the plain Levenshtein distance. |

Costs must be finite and `>= 0`. Unknown options, out-of-range costs, and wrongly typed
values throw rather than being silently ignored.

### `dl.distance(source, target)`

Returns the cost of transforming `source` into `target`. Throws a `TypeError` if either
argument is not a string.

### `distance(source, target, options?)`

One-shot convenience wrapper that constructs a `DamerauLevenshtein` and calls `distance`.

### Types

`DamerauLevenshteinOptions`, `CharCostFunction`, `SubstituteCostFunction`,
`TransposeCostFunction`, and `Cost` are all exported.

## Custom costs

Costs can be flat numbers or functions of the characters involved — useful when, say, a
typo on an adjacent keyboard key should count for less than an unrelated character:

```ts
const dl = new DamerauLevenshtein({
  insert: 1,
  remove: 0.5,
  substitute: (from, to) => (from === "a" && to === "e" ? 0.3 : 1),
  transpose: (backward, forward) => (backward === "n" ? 0.5 : 1),
});

dl.distance("apple", "epple"); // 0.3
```

`substitute` receives `(from, to)`: the source character and the target character it is
replaced with. `transpose` receives `(backward, forward)`: the two adjacent source
characters being swapped, in the order they appear in `source`.

To compute the plain Levenshtein distance, turn transpositions off:

```ts
new DamerauLevenshtein({ transpositions: false }).distance("ab", "ba"); // 2
```

## Unicode

Strings are compared by code point, so characters outside the Basic Multilingual Plane
count as a single character:

```ts
distance("😀🎉", "🎉😀"); // 1
```

Combining marks are _not_ normalized, so a precomposed `"\u00e9"` and a decomposed
`"e\u0301"` are two different strings (distance `2`). Normalize both sides first if you
want them treated as equal:

```ts
distance("\u00e9".normalize("NFC"), "e\u0301".normalize("NFC")); // 0
```

## Which algorithm is this?

This is the **optimal string alignment** (OSA) variant of Damerau-Levenshtein, also called
the restricted edit distance: no substring is edited more than once. It is what most
spell-checking and fuzzy-search code wants, and it is what the great majority of
"damerau-levenshtein" packages implement.

The practical consequence is that a transposition whose characters need further editing is
not shared across operations:

```ts
distance("a cat", "an act"); // 2 — insert "n", transpose "c" and "a"
distance("a cat", "an abct"); // 4 — an unrestricted implementation reports 3
```

OSA is also not a true metric: it does not satisfy the triangle inequality. Turn
transpositions off to get plain Levenshtein, which does.

Complexity is O(n·m) time and O(min(n, m)) memory, where n and m are the code-point lengths
of the two strings.

## Example: spelling suggestions

```ts
import { DamerauLevenshtein } from "@crob/damerau-levenshtein";

const dl = new DamerauLevenshtein();
const dictionary = ["apple", "banana", "orange", "pear", "peach", "pineapple", "plum"];

function suggest(query: string, limit = 3): string[] {
  return dictionary
    .map((word) => ({ word, score: dl.distance(query.toLowerCase(), word) }))
    .sort((a, b) => a.score - b.score)
    .slice(0, limit)
    .map(({ word }) => word);
}

suggest("aplpe"); // ["apple", "plum", "pear"]
```

A runnable version lives in [`example/index.html`](./example/index.html).

## Migrating from 1.x

Version 2 is a breaking release. The headline change: **transpositions are now on by
default**, which is what the class name and the old documentation always implied.

| 1.x                                 | 2.x                                                 |
| ----------------------------------- | --------------------------------------------------- |
| `new DamerauLevenshtein()`          | `new DamerauLevenshtein({ transpositions: false })` |
| `new DamerauLevenshtein({}, true)`  | `new DamerauLevenshtein()`                          |
| `new DamerauLevenshtein({}, false)` | `new DamerauLevenshtein({ transpositions: false })` |
| `const DL = require("...")`         | `const { DamerauLevenshtein } = require("...")`     |

Passing a second positional argument now throws with a pointer to this table, so the
change cannot silently alter your results.

Also worth knowing:

- **Transpositions no longer switch themselves on.** In 1.x, supplying a `transpose` cost
  forced transpositions on even when they were explicitly disabled. Use `transpositions`.
- **`transpose` argument order was fixed.** It was documented as `(backward, forward)` but
  called as `(forward, backward)`. It now matches the documentation.
- **Custom `insert`/`remove` costs now apply to every edit.** In 1.x the first row and
  column of the distance matrix were hard-coded to 1 per character, so
  `new DamerauLevenshtein({ remove: 3 }).distance("abc", "")` returned `3` instead of `9`.
- **Strings are compared by code point**, not UTF-16 code unit, so distances involving
  emoji and other astral characters changed.
- **Invalid options throw.** A misspelled option or a non-numeric cost used to be silently
  replaced with the default.
- **Node 20.19+ is required**, and the published package now ships type declarations.

## Development

```sh
npm ci
npm test            # vitest, including property-based tests
npm run test:coverage
npm run typecheck
npm run build       # ESM + CJS + UMD bundles and .d.ts declarations
npm run lint:package
```

## Releasing

1. Bump `version` in `package.json` and land it on `main`.
2. Publish a GitHub release whose tag matches that version (`2.0.0` or `v2.0.0`).
3. The [publish workflow](.github/workflows/publish.yml) typechecks, tests, builds, and
   verifies the tag against `package.json` before running `npm publish --provenance`.

The workflow authenticates with the `NPM_TOKEN` repository secret. Configuring
[npm trusted publishing](https://docs.npmjs.com/trusted-publishers) for this package is
worth doing: it drops the secret entirely in favour of the workflow's OIDC identity.

## Contributing

Issues and pull requests are welcome on
[GitHub](https://github.com/chiribuc/damerau-levenshtein). Please keep the test suite green
and run `npm run format` before opening a PR.

Thanks to everyone who has
[contributed](https://github.com/chiribuc/damerau-levenshtein/graphs/contributors) — see
the [changelog](./CHANGELOG.md) for what each release brought.

## License

[MIT](./LICENSE) © Robert-Cristian Chiribuc
