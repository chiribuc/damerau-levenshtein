import type { DamerauLevenshteinOptions } from "../src/types.js";

/**
 * Deliberately naive optimal-string-alignment implementation, kept as a
 * cross-check for the optimized rolling-row version in `src`.
 *
 * Full matrix, no fast paths, no rotation — slow and obviously correct.
 */
export function referenceDistance(
  source: string,
  target: string,
  options: DamerauLevenshteinOptions = {},
): number {
  const insert = asFunction(options.insert);
  const remove = asFunction(options.remove);
  const substitute = asFunction(options.substitute);
  const transpose = asFunction(options.transpose);
  const transpositions = options.transpositions ?? true;

  const a = [...source];
  const b = [...target];

  const ds: number[][] = [];
  for (let i = 0; i <= a.length; i += 1) {
    ds.push(new Array<number>(b.length + 1).fill(0));
  }

  for (let j = 1; j <= b.length; j += 1) {
    ds[0]![j] = ds[0]![j - 1]! + insert(b[j - 1]!);
  }
  for (let i = 1; i <= a.length; i += 1) {
    ds[i]![0] = ds[i - 1]![0]! + remove(a[i - 1]!);
  }

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const deletion = ds[i - 1]![j]! + remove(a[i - 1]!);
      const insertion = ds[i]![j - 1]! + insert(b[j - 1]!);
      const substitution =
        ds[i - 1]![j - 1]! + (a[i - 1] === b[j - 1] ? 0 : substitute(a[i - 1]!, b[j - 1]!));

      let best = Math.min(deletion, insertion, substitution);

      if (transpositions && i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        best = Math.min(best, ds[i - 2]![j - 2]! + transpose(a[i - 2]!, a[i - 1]!));
      }

      ds[i]![j] = best;
    }
  }

  return ds[a.length]![b.length]!;
}

function asFunction(
  cost: number | ((...args: never[]) => number) | undefined,
): (...args: string[]) => number {
  if (typeof cost === "function") return cost as (...args: string[]) => number;
  if (typeof cost === "number") return () => cost;
  return () => 1;
}
