import path from "path";
import {defineConfig} from "vite";

export default defineConfig({
    build: {
    sourcemap: true,
    lib: {
      entry: path.resolve(__dirname, "src/main.js"),
      name: "DamerauLevenshtein",
      fileName: (format) => `damerau-levenshtein.${format}.js`
    }
  },
});
