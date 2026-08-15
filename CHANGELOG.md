## 2.0.0 - 2026-08-15

Rewritten in TypeScript, with a breaking change to the constructor. See the migration
table in the [README](./README.md#migrating-from-1x).

### Breaking

- Transpositions are now **on by default**. `new DamerauLevenshtein()` computes the
  Damerau-Levenshtein distance; pass `{ transpositions: false }` for plain Levenshtein.
- The second positional constructor argument is gone, replaced by the `transpositions`
  option. Passing it now throws with a migration hint instead of silently changing results.
- Custom `insert`/`remove` costs now apply to the first row and column of the distance
  matrix. `new DamerauLevenshtein({ remove: 3 }).distance("abc", "")` returns `9`, not `3`.
- The `transpose` callback now receives `(backward, forward)`, matching the documented
  signature. It was previously called with the arguments reversed.
- Supplying a `transpose` cost no longer forces transpositions on when they were
  explicitly disabled. The intent behind that 1.0.2 behaviour — that a configured
  transposition cost is actually used — is now covered by `transpositions` defaulting to
  `true`; `transpositions: false` stays authoritative.
- Strings are compared by Unicode code point rather than UTF-16 code unit, so distances
  involving emoji and other astral characters change.
- Invalid options — unknown keys, non-numeric costs, negative or non-finite costs — now
  throw instead of falling back to the default cost.
- `distance()` throws a `TypeError` when either argument is not a string.
- CommonJS consumers get named exports: `const { DamerauLevenshtein } = require(...)`.
- Requires Node.js `^20.19.0 || >=22.12.0`.

### Added

- TypeScript declarations for both ESM and CommonJS consumers, plus exported types for
  every cost callback.
- A `distance(source, target, options?)` helper for one-off comparisons.
- A `transpositions` boolean option.
- ESM, CommonJS, and UMD builds, all with source maps and shipped sources.

### Changed

- Memory use is now O(min(n, m)) instead of O(n·m); only three matrix rows are kept live.
- Toolchain moved to Vite 8, Vitest 4, and TypeScript 7; jest and babel are gone.
- Test suite expanded to property-based tests cross-checked against a naive reference
  implementation, at 100% coverage.
- CI runs lint, typecheck, build, packaging checks, and tests on Node 20, 22, and 24. The
  publish workflow now builds and verifies before publishing, with npm provenance.

### Fixed

- Carries [@nadalaba](https://github.com/nadalaba)'s transposition fix from 1.0.2, which
  never made it to npm. Anyone still on 1.0.1 gets it here.
- The published package could ship without `dist/`: the release workflow never ran a
  build. `prepublishOnly` and an explicit build step now guarantee the artifacts exist.

## 1.0.2 - 2026-08-15

Tagged and [released on GitHub](https://github.com/chiribuc/damerau-levenshtein/releases/tag/1.0.2),
but never reached npm — the publish workflow failed before uploading. Everything below is
included in 2.0.0.

### Fixed

- Transpositions were charged one unit more than the configured `transpose` cost, so an
  adjacent swap cost 2 instead of 1 under the default costs.

### Changed

- Supplying a `transpose` cost now enables transpositions, so a configured cost is no
  longer ignored.

Both changes come from [#7](https://github.com/chiribuc/damerau-levenshtein/pull/7) by
[@nadalaba](https://github.com/nadalaba) — their first contribution to this project. Thank you!

## 1.0.1 - 2024-01-11

- dependency updates

## 1.0.0 - 2023-11-18

- initial release
