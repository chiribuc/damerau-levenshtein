/**
 * Emits CommonJS-flavoured declarations next to the ESM ones.
 *
 * The package is `"type": "module"`, so every `.d.ts` TypeScript writes is
 * treated as ESM. Consumers who `require()` the package would resolve those
 * files under the CJS condition and get "types masquerading as ESM" errors.
 * Mirroring each declaration as `.d.cts` — with relative specifiers pointing at
 * their `.cjs` siblings — gives `require()` a correctly-flavoured entry point.
 */
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const DIST = new URL("../dist/", import.meta.url).pathname;

const declarations = (await readdir(DIST)).filter(
  (file) => file.endsWith(".d.ts") && !file.endsWith(".d.cts"),
);

if (declarations.length === 0) {
  throw new Error("No declaration files found in dist/. Did `tsc` run first?");
}

await Promise.all(
  declarations.map(async (file) => {
    const source = await readFile(join(DIST, file), "utf8");

    const cjs = source
      // ./types.js -> ./types.cjs, so CJS resolution finds ./types.d.cts
      .replace(/(from\s+["']\.{1,2}\/[^"']+)\.js(["'])/g, "$1.cjs$2")
      // Declaration maps are emitted for the .d.ts files only.
      .replace(/^\/\/# sourceMappingURL=.*$\n?/gm, "");

    await writeFile(join(DIST, file.replace(/\.d\.ts$/, ".d.cts")), cjs);
  }),
);

console.log(
  `Emitted ${declarations.length} .d.cts declaration${declarations.length === 1 ? "" : "s"}.`,
);
