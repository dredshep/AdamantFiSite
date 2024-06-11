// errors/apiErrors.ts
export class MissingApiKeyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MissingApiKeyError";
  }
}

export class MissingAuthHeaderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MissingAuthHeaderError";
  }
}

export class MissingApiUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MissingApiUrlError";
  }
}

export class HttpResponseError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message);
    this.name = "HttpResponseError";
  }
}
