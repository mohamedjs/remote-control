/**
 * Structured application error with error code, message, retryable flag, and optional cause.
 */
export class AppError extends Error {
  /**
   * @param {string} code
   * @param {string} message
   * @param {boolean} [retryable=false]
   * @param {unknown} [cause=null]
   */
  constructor(code, message, retryable = false, cause = null) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.retryable = retryable;
    this.cause = cause;
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      retryable: this.retryable,
      cause: this.cause instanceof Error ? this.cause.message : this.cause,
    };
  }
}
