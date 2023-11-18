// DamerauLevenshtein.test.js
import DamerauLevenshtein from "../src/main";

describe("DamerauLevenshtein", () => {
  it("should calculate distance between two equal strings as 0", () => {
    const dl = new DamerauLevenshtein();
    expect(dl.distance("kitten", "kitten")).toBe(0);
  });

  it("should calculate distance between two different strings", () => {
    const dl = new DamerauLevenshtein();
    expect(dl.distance("kitten", "sitting")).toBe(3);
  });

  it("should handle custom cost functions", () => {
    const dl = new DamerauLevenshtein({
      insert: 2,
      remove: 3,
      substitute: 1,
      transpose: 2,
    });

    expect(dl.distance("kitten", "sitting")).toBe(4);
  });

  it("should handle Levenshtein distance", () => {
    const dl = new DamerauLevenshtein({}, false);

    expect(dl.distance("kittens", "ktniten")).toBe(4);
  });

  it("should handle Damerau-Levenshtein distance", () => {
    const dl = new DamerauLevenshtein();

    expect(dl.distance("kittens", "ktnitens")).toBe(3);
  });
});
