/**
 * Creates a new StringError with the given message.
 *
 * @param {string} message - The error message.
 */
export class StringError extends Error {
    constructor(message) {
      super();
      this.name = "StringError";
      this.message = message;
    }
  }
  