/**
 * Simple Result type for expected functional domain failures.
 */
export class Result {
  /**
   * @param {boolean} ok
   * @param {any} [value]
   * @param {any} [error]
   */
  constructor(ok, value, error) {
    this.ok = ok;
    this.value = value;
    this.error = error;
  }

  static ok(value) {
    return new Result(true, value, null);
  }

  static err(error) {
    return new Result(false, null, error);
  }

  map(fn) {
    if (!this.ok) return this;
    return Result.ok(fn(this.value));
  }

  unwrap() {
    if (!this.ok) throw this.error instanceof Error ? this.error : new Error(String(this.error));
    return this.value;
  }

  unwrapOr(fallback) {
    return this.ok ? this.value : fallback;
  }
}
