class DamerauLevenshtein {
  constructor(options = {}, damerau = false) {
    this.damerau = damerau;
    this.insert = this.getCostFunction(options.insert, 1);
    this.remove = this.getCostFunction(options.remove, 1);
    this.substitute = this.getCostFunction(options.substitute, 1);
    this.transpose = this.getCostFunction(options.transpose, 1);
  }

  getCostFunction(cost, defaultCost) {
    if (typeof cost === "function") {
      return cost;
    } else if (typeof cost === "number") {
      return () => cost;
    } else {
      return () => defaultCost;
    }
  }

  distance(down, across) {
    if (down === across) {
      return 0;
    }

    const ds = Array.from({ length: down.length + 1 }, () =>
      Array(across.length + 1).fill(0),
    );

    for (let i = 0; i <= down.length; i++) {
      for (let j = 0; j <= across.length; j++) {
        if (i === 0) {
          ds[i][j] = j;
        } else if (j === 0) {
          ds[i][j] = i;
        } else {
          const deletionCost = ds[i - 1][j] + this.remove(down[i - 1]);
          const insertionCost = ds[i][j - 1] + this.insert(across[j - 1]);
          const substitutionCost =
            ds[i - 1][j - 1] +
            (down[i - 1] === across[j - 1]
              ? 0
              : this.substitute(down[i - 1], across[j - 1]));
          ds[i][j] = Math.min(deletionCost, insertionCost, substitutionCost);

          if (
            this.damerau &&
            i > 1 &&
            j > 1 &&
            down[i - 1] === across[j - 2] &&
            down[i - 2] === across[j - 1]
          ) {
            ds[i][j] = Math.min(
              ds[i][j],
              ds[i - 2][j - 2] + this.transpose(down[i - 1], down[i - 2]) + 1,
            );
          }
        }
      }
    }

    return ds[down.length][across.length];
  }
}

export default DamerauLevenshtein;
