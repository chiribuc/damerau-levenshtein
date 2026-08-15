import { DamerauLevenshtein } from "./damerau-levenshtein.js";
import type { DamerauLevenshteinOptions } from "./types.js";

export { DamerauLevenshtein };
export type {
  CharCostFunction,
  Cost,
  DamerauLevenshteinOptions,
  SubstituteCostFunction,
  TransposeCostFunction,
} from "./types.js";

/**
 * One-shot convenience wrapper around {@link DamerauLevenshtein}.
 *
 * ```ts
 * distance("kitten", "sitting"); // 3
 * ```
 *
 * Comparing many pairs with the same configuration? Create a
 * {@link DamerauLevenshtein} instance instead and reuse it, so the options are
 * only validated once.
 */
export function distance(
  source: string,
  target: string,
  options?: DamerauLevenshteinOptions,
): number {
  return new DamerauLevenshtein(options).distance(source, target);
}

export default DamerauLevenshtein;
