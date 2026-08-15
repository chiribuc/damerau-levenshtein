import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { DamerauLevenshtein } from "../src/index.js";
import { referenceDistance } from "./reference.js";

/** Small alphabet, so random pairs actually share characters worth aligning. */
const word = fc.stringMatching(/^[abc😀]{0,12}$/u);
const anyString = fc.string({ maxLength: 12 });

const costs = fc.record({
  insert: fc.double({ min: 0, max: 4, noNaN: true }),
  remove: fc.double({ min: 0, max: 4, noNaN: true }),
  substitute: fc.double({ min: 0, max: 4, noNaN: true }),
  transpose: fc.double({ min: 0, max: 4, noNaN: true }),
  transpositions: fc.boolean(),
});

describe("agreement with the reference implementation", () => {
  it("matches on unit costs", () => {
    fc.assert(
      fc.property(word, word, (source, target) => {
        expect(new DamerauLevenshtein().distance(source, target)).toBe(
          referenceDistance(source, target),
        );
      }),
    );
  });

  it("matches on arbitrary costs", () => {
    fc.assert(
      fc.property(word, word, costs, (source, target, options) => {
        expect(new DamerauLevenshtein(options).distance(source, target)).toBeCloseTo(
          referenceDistance(source, target, options),
          10,
        );
      }),
    );
  });

  it("matches on unconstrained strings", () => {
    fc.assert(
      fc.property(anyString, anyString, (source, target) => {
        expect(new DamerauLevenshtein().distance(source, target)).toBe(
          referenceDistance(source, target),
        );
      }),
    );
  });
});

describe("metric properties", () => {
  const dl = new DamerauLevenshtein();
  const levenshtein = new DamerauLevenshtein({ transpositions: false });

  it("is zero exactly when the strings are equal", () => {
    fc.assert(
      fc.property(word, word, (source, target) => {
        expect(dl.distance(source, source)).toBe(0);
        expect(dl.distance(source, target) === 0).toBe(source === target);
      }),
    );
  });

  it("is symmetric", () => {
    fc.assert(
      fc.property(word, word, (source, target) => {
        expect(dl.distance(source, target)).toBe(dl.distance(target, source));
      }),
    );
  });

  it("satisfies the triangle inequality without transpositions", () => {
    // Optimal string alignment deliberately breaks this, so it only holds for
    // the plain Levenshtein configuration.
    fc.assert(
      fc.property(word, word, word, (a, b, c) => {
        expect(levenshtein.distance(a, c)).toBeLessThanOrEqual(
          levenshtein.distance(a, b) + levenshtein.distance(b, c),
        );
      }),
    );
  });

  it("stays within the length bounds", () => {
    fc.assert(
      fc.property(word, word, (source, target) => {
        const a = [...source].length;
        const b = [...target].length;
        const result = dl.distance(source, target);

        expect(result).toBeGreaterThanOrEqual(Math.abs(a - b));
        expect(result).toBeLessThanOrEqual(Math.max(a, b));
      }),
    );
  });

  it("never exceeds the Levenshtein distance", () => {
    fc.assert(
      fc.property(word, word, (source, target) => {
        expect(dl.distance(source, target)).toBeLessThanOrEqual(
          levenshtein.distance(source, target),
        );
      }),
    );
  });

  it("costs at most one edit per appended character", () => {
    fc.assert(
      fc.property(word, word, (source, suffix) => {
        expect(dl.distance(source, source + suffix)).toBeLessThanOrEqual([...suffix].length);
      }),
    );
  });
});
