export class MagiError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'MagiError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class MagiValidationError extends MagiError {
  constructor(message: string, public readonly validationErrors?: unknown) {
    super(message);
    this.name = 'MagiValidationError';
  }
}

export class MagiProviderError extends MagiError {
  constructor(
    message: string,
    public readonly providerId: string,
    public readonly statusCode?: number,
    cause?: unknown
  ) {
    super(`[${providerId}] ${message}`, cause);
    this.name = 'MagiProviderError';
  }
}

export class MagiDeliberationError extends MagiError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = 'MagiDeliberationError';
  }
}
