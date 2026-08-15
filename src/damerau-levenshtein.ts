import { describe, toCostFunction } from "./cost.js";
import type {
  CharCostFunction,
  DamerauLevenshteinOptions,
  SubstituteCostFunction,
  TransposeCostFunction,
} from "./types.js";

const KNOWN_OPTIONS = ["insert", "remove", "substitute", "transpose", "transpositions"] as const;

/**
 * Computes the Damerau-Levenshtein edit distance between two strings.
 *
 * The instance holds the cost configuration, so build it once and reuse it for
 * as many comparisons as you like:
 *
 * ```ts
 * const dl = new DamerauLevenshtein();
 * dl.distance("kitten", "sitting"); // 3
 * ```
 *
 * This is the *optimal string alignment* variant: no substring is edited more
 * than once, so `distance("CA", "ABC")` is 3 rather than the 2 an unrestricted
 * implementation reports. That restriction is what nearly every practical
 * spell-checking use case wants, and it keeps the algorithm O(n·m) time and
 * O(min(n, m)) memory.
 */
export class DamerauLevenshtein {
  /** Whether adjacent transpositions count as a single edit. */
  readonly transpositions: boolean;

  readonly #insert: CharCostFunction;
  readonly #remove: CharCostFunction;
  readonly #substitute: SubstituteCostFunction;
  readonly #transpose: TransposeCostFunction;

  constructor(options: DamerauLevenshteinOptions = {}, ...rest: never[]) {
    if (rest.length > 0) {
      throw new TypeError(
        "DamerauLevenshtein takes a single options argument. The second positional " +
          "argument was removed in v2 — use `new DamerauLevenshtein({ transpositions: false })` " +
          "to compute the plain Levenshtein distance.",
      );
    }

    if (options === null || typeof options !== "object" || Array.isArray(options)) {
      throw new TypeError(`Options must be an object, received ${describe(options)}.`);
    }

    for (const key of Object.keys(options)) {
      if (!(KNOWN_OPTIONS as readonly string[]).includes(key)) {
        throw new TypeError(
          `Unknown option "${key}". Supported options are: ${KNOWN_OPTIONS.join(", ")}.`,
        );
      }
    }

    if (options.transpositions !== undefined && typeof options.transpositions !== "boolean") {
      throw new TypeError(
        `Option "transpositions" must be a boolean, received ${describe(options.transpositions)}.`,
      );
    }

    this.transpositions = options.transpositions ?? true;
    this.#insert = toCostFunction(options.insert, 1, "insert");
    this.#remove = toCostFunction(options.remove, 1, "remove");
    this.#substitute = toCostFunction(options.substitute, 1, "substitute");
    this.#transpose = toCostFunction(options.transpose, 1, "transpose");
  }

  /**
   * Returns the cost of transforming `source` into `target`.
   *
   * Strings are compared by Unicode code point, so characters outside the
   * Basic Multilingual Plane (emoji, for example) count as one character each.
   *
   * @throws {TypeError} If either argument is not a string.
   */
  distance(source: string, target: string): number {
    assertString(source, "source");
    assertString(target, "target");

    if (source === target) {
      return 0;
    }

    const a = [...source];
    const b = [...target];
    const rows = a.length;
    const columns = b.length;

    if (rows === 0) {
      return b.reduce((total, char) => total + this.#insert(char), 0);
    }

    if (columns === 0) {
      return a.reduce((total, char) => total + this.#remove(char), 0);
    }

    // Only three rows of the distance matrix are ever live: the current row,
    // the previous one, and — for transpositions — the one before that.
    let twoBack = new Array<number>(columns + 1).fill(0);
    let previous = new Array<number>(columns + 1);
    let current = new Array<number>(columns + 1).fill(0);

    // Row 0: the cost of building `target` from an empty string.
    previous[0] = 0;
    for (let j = 1; j <= columns; j += 1) {
      previous[j] = previous[j - 1]! + this.#insert(b[j - 1]!);
    }

    for (let i = 1; i <= rows; i += 1) {
      const sourceChar = a[i - 1]!;
      // Column 0: the cost of deleting `source` down to an empty string.
      current[0] = previous[0]! + this.#remove(sourceChar);

      for (let j = 1; j <= columns; j += 1) {
        const targetChar = b[j - 1]!;

        const deletion = previous[j]! + this.#remove(sourceChar);
        const insertion = current[j - 1]! + this.#insert(targetChar);
        const substitution =
          previous[j - 1]! +
          (sourceChar === targetChar ? 0 : this.#substitute(sourceChar, targetChar));

        let best = Math.min(deletion, insertion, substitution);

        if (
          this.transpositions &&
          i > 1 &&
          j > 1 &&
          sourceChar === b[j - 2] &&
          a[i - 2] === targetChar
        ) {
          const transposition = twoBack[j - 2]! + this.#transpose(a[i - 2]!, sourceChar);
          best = Math.min(best, transposition);
        }

        current[j] = best;
      }

      // Rotate the rows, reusing the oldest array as the next scratch buffer.
      const scratch = twoBack;
      twoBack = previous;
      previous = current;
      current = scratch;
    }

    return previous[columns]!;
  }
}

function assertString(value: string, name: string): void {
  if (typeof value !== "string") {
    throw new TypeError(`Argument "${name}" must be a string, received ${describe(value)}.`);
  }
}
