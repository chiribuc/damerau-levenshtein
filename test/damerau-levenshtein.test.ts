import { describe, expect, it, vi } from "vitest";

import DefaultExport, { DamerauLevenshtein, distance } from "../src/index.js";

describe("distances", () => {
  const dl = new DamerauLevenshtein();

  it.each([
    ["", "", 0],
    ["kitten", "kitten", 0],
    ["", "abc", 3],
    ["abc", "", 3],
    ["kitten", "sitting", 3],
    ["saturday", "sunday", 3],
    ["flaw", "lawn", 2],
    ["ab", "ba", 1],
    ["a cat", "an act", 2],
    // Both of these are 1 cheaper under an unrestricted implementation; see
    // the "optimal string alignment" tests below.
    ["a cat", "an abct", 4],
    ["CA", "ABC", 3],
  ])("distance(%o, %o) === %i", (source, target, expected) => {
    expect(dl.distance(source, target)).toBe(expected);
  });

  it("is symmetric under the default unit costs", () => {
    expect(dl.distance("kitten", "sitting")).toBe(dl.distance("sitting", "kitten"));
  });

  it("handles long inputs without exhausting memory", () => {
    const source = "a".repeat(2000);
    const target = `${"a".repeat(1999)}b`;

    expect(dl.distance(source, target)).toBe(1);
  });
});

describe("transpositions", () => {
  it("counts an adjacent swap as one edit by default", () => {
    expect(new DamerauLevenshtein().distance("ab", "ba")).toBe(1);
  });

  it("falls back to Levenshtein when disabled", () => {
    const levenshtein = new DamerauLevenshtein({ transpositions: false });

    expect(levenshtein.distance("ab", "ba")).toBe(2);
    expect(levenshtein.distance("kittens", "ktniten")).toBe(4);
  });

  it("is never more expensive than the Levenshtein distance", () => {
    const damerau = new DamerauLevenshtein();
    const levenshtein = new DamerauLevenshtein({ transpositions: false });

    expect(damerau.distance("kittens", "ktnitens")).toBeLessThanOrEqual(
      levenshtein.distance("kittens", "ktnitens"),
    );
  });

  it("only edits any one substring once (optimal string alignment)", () => {
    // An unrestricted Damerau-Levenshtein implementation would report 2 here.
    expect(new DamerauLevenshtein().distance("CA", "ABC")).toBe(3);
  });

  it("respects a custom transposition cost", () => {
    expect(new DamerauLevenshtein({ transpose: 0.5 }).distance("ab", "ba")).toBe(0.5);
    // Two substitutions are cheaper than one expensive transposition.
    expect(new DamerauLevenshtein({ transpose: 5 }).distance("ab", "ba")).toBe(2);
  });

  it("keeps transpositions disabled even when a transpose cost is supplied", () => {
    const dl = new DamerauLevenshtein({ transpose: 0.5, transpositions: false });

    expect(dl.distance("ab", "ba")).toBe(2);
  });
});

describe("custom costs", () => {
  it("accepts flat numbers", () => {
    const dl = new DamerauLevenshtein({
      insert: 2,
      remove: 3,
      substitute: 1,
      transpose: 2,
    });

    expect(dl.distance("kitten", "sitting")).toBe(4);
  });

  it("applies insertion costs when the source is empty", () => {
    expect(new DamerauLevenshtein({ insert: 2 }).distance("", "abc")).toBe(6);
  });

  it("applies removal costs when the target is empty", () => {
    expect(new DamerauLevenshtein({ remove: 3 }).distance("abc", "")).toBe(9);
  });

  it("applies border costs on the way to a full alignment", () => {
    // Every alignment of "ab" -> "cd" that walks the matrix border pays
    // 2 removals + 2 insertions = 10; substituting both is cheaper at 8.
    const dl = new DamerauLevenshtein({ insert: 2, remove: 3, substitute: 4 });

    expect(dl.distance("ab", "cd")).toBe(8);
  });

  it("accepts cost functions", () => {
    const dl = new DamerauLevenshtein({
      insert: (char) => (char === "z" ? 0.25 : 1),
      remove: () => 1,
      substitute: (from) => (from === "a" ? 0.5 : 1),
    });

    expect(dl.distance("ab", "abz")).toBe(0.25);
    expect(dl.distance("ab", "cb")).toBe(0.5);
  });

  it("passes substitution characters as (from, to)", () => {
    const substitute = vi.fn(() => 1);
    new DamerauLevenshtein({ substitute }).distance("a", "b");

    expect(substitute).toHaveBeenCalledWith("a", "b");
  });

  it("passes transposition characters as (backward, forward)", () => {
    const transpose = vi.fn(() => 1);
    new DamerauLevenshtein({ transpose }).distance("ab", "ba");

    // "a" comes first in the source, "b" second.
    expect(transpose).toHaveBeenCalledWith("a", "b");
  });

  it("never charges for substituting a character with itself", () => {
    const substitute = vi.fn(() => 1);
    new DamerauLevenshtein({ substitute }).distance("abc", "abc.");

    for (const [from, to] of substitute.mock.calls as unknown as [string, string][]) {
      expect(from).not.toBe(to);
    }
  });
});

describe("unicode", () => {
  it("treats astral characters as single characters", () => {
    const dl = new DamerauLevenshtein();

    expect(dl.distance("😀", "🎉")).toBe(1);
    expect(dl.distance("😀🎉", "🎉😀")).toBe(1);
    expect(dl.distance("a😀b", "ab")).toBe(1);
  });

  it("compares code points, not code units", () => {
    expect(new DamerauLevenshtein().distance("𝒜", "a")).toBe(1);
  });

  it("does not normalize combining marks", () => {
    const precomposed = "\u00e9"; // é
    const decomposed = "e\u0301"; // e + combining acute accent

    // Different code points, so callers who want these treated as equal
    // have to normalize before comparing.
    expect(new DamerauLevenshtein().distance(precomposed, decomposed)).toBe(2);
    expect(new DamerauLevenshtein().distance(precomposed.normalize("NFD"), decomposed)).toBe(0);
  });
});

describe("validation", () => {
  it.each([
    [123, "a"],
    ["a", null],
    [undefined, "a"],
    [["a"], "a"],
  ])("rejects non-string arguments (%o, %o)", (source, target) => {
    const dl = new DamerauLevenshtein();

    expect(() => dl.distance(source as unknown as string, target as unknown as string)).toThrow(
      TypeError,
    );
  });

  it("names the offending argument", () => {
    const dl = new DamerauLevenshtein();

    expect(() => dl.distance("a", 1 as unknown as string)).toThrow(
      'Argument "target" must be a string, received number.',
    );
  });

  it("rejects a second positional argument with a migration hint", () => {
    expect(
      () =>
        new (DamerauLevenshtein as unknown as new (o: object, d: boolean) => unknown)({}, false),
    ).toThrow(/second positional argument was removed in v2/);
  });

  it.each([
    [null, "null"],
    ["nope", '"nope"'],
    [[], "an array"],
    [42, "number"],
  ])("rejects non-object options (%o)", (options, described) => {
    expect(() => new DamerauLevenshtein(options as never)).toThrow(
      `Options must be an object, received ${described}.`,
    );
  });

  it("rejects unknown options", () => {
    expect(() => new DamerauLevenshtein({ transposition: true } as never)).toThrow(
      /Unknown option "transposition"/,
    );
  });

  it("rejects a non-boolean transpositions flag", () => {
    expect(() => new DamerauLevenshtein({ transpositions: "yes" as never })).toThrow(
      'Option "transpositions" must be a boolean, received "yes".',
    );
  });

  it.each(["insert", "remove", "substitute", "transpose"])(
    "rejects a non-numeric %s cost",
    (option) => {
      expect(() => new DamerauLevenshtein({ [option]: "1" } as never)).toThrow(
        `Option "${option}" must be a number or a function, received "1".`,
      );
    },
  );

  it.each([
    [-1, "-1"],
    [Number.NaN, "NaN"],
    [Number.POSITIVE_INFINITY, "Infinity"],
  ])("rejects an out-of-range cost (%o)", (cost, described) => {
    expect(() => new DamerauLevenshtein({ insert: cost })).toThrow(
      `Option "insert" must be a finite number greater than or equal to 0, received ${described}.`,
    );
  });

  it("allows a zero cost", () => {
    expect(new DamerauLevenshtein({ insert: 0 }).distance("ab", "abc")).toBe(0);
  });

  it("accepts an explicitly undefined option", () => {
    expect(new DamerauLevenshtein({ insert: undefined } as never).distance("ab", "abc")).toBe(1);
  });
});

describe("module surface", () => {
  it("exports the class as both a named and a default export", () => {
    expect(DefaultExport).toBe(DamerauLevenshtein);
  });

  it("exposes a one-shot distance function", () => {
    expect(distance("kitten", "sitting")).toBe(3);
    expect(distance("ab", "ba", { transpositions: false })).toBe(2);
  });

  it("reports the configured transposition flag", () => {
    expect(new DamerauLevenshtein().transpositions).toBe(true);
    expect(new DamerauLevenshtein({ transpositions: false }).transpositions).toBe(false);
  });
});
