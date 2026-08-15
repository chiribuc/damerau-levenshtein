import type { Cost } from "./types.js";

/**
 * Turns a cost option into a function.
 *
 * Numbers become constant functions, functions are used as-is, and `undefined`
 * falls back to `defaultCost`. Anything else is a configuration mistake and
 * throws rather than being silently ignored.
 */
export function toCostFunction<F extends (...args: never[]) => number>(
  option: Cost<F> | undefined,
  defaultCost: number,
  name: string,
): F {
  if (option === undefined) {
    return (() => defaultCost) as F;
  }

  if (typeof option === "function") {
    return option;
  }

  if (typeof option === "number") {
    assertValidCost(option, name);
    const constant = option;
    return (() => constant) as F;
  }

  throw new TypeError(
    `Option "${name}" must be a number or a function, received ${describe(option)}.`,
  );
}

/** Costs must be finite and non-negative, or the distance matrix is meaningless. */
export function assertValidCost(value: number, name: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(
      `Option "${name}" must be a finite number greater than or equal to 0, received ${String(value)}.`,
    );
  }
}

export function describe(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "string") return JSON.stringify(value);
  if (Array.isArray(value)) return "an array";
  return typeof value;
}
