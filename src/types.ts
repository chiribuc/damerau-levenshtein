/**
 * Cost of inserting or removing a single character.
 *
 * @param char - The character being inserted (from the target) or removed
 *   (from the source). Always a single Unicode code point.
 */
export type CharCostFunction = (char: string) => number;

/**
 * Cost of substituting one character for another.
 *
 * @param from - The character in the source string.
 * @param to - The character it is replaced with, from the target string.
 */
export type SubstituteCostFunction = (from: string, to: string) => number;

/**
 * Cost of transposing two adjacent characters.
 *
 * @param backward - The character that appears first in the source string.
 * @param forward - The character that appears second in the source string.
 */
export type TransposeCostFunction = (backward: string, forward: string) => number;

/** A cost is either a flat number or a function returning one. */
export type Cost<F> = number | F;

export interface DamerauLevenshteinOptions {
  /**
   * Cost of inserting a character. Defaults to `1`.
   */
  insert?: Cost<CharCostFunction>;

  /**
   * Cost of removing a character. Defaults to `1`.
   */
  remove?: Cost<CharCostFunction>;

  /**
   * Cost of substituting one character for another. Defaults to `1`.
   */
  substitute?: Cost<SubstituteCostFunction>;

  /**
   * Cost of transposing two adjacent characters. Defaults to `1`.
   *
   * Ignored when {@link DamerauLevenshteinOptions.transpositions} is `false`.
   */
  transpose?: Cost<TransposeCostFunction>;

  /**
   * Whether adjacent transpositions count as a single edit.
   *
   * `true` (the default) computes the Damerau-Levenshtein distance; `false`
   * computes the plain Levenshtein distance.
   */
  transpositions?: boolean;
}
