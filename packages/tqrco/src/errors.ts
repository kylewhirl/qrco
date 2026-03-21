export class TqrcoError extends Error {
  readonly status: number;
  readonly endpoint: string;
  readonly body: unknown;

  constructor(message: string, options: { status: number; endpoint: string; body: unknown }) {
    super(message);
    this.name = "TqrcoError";
    this.status = options.status;
    this.endpoint = options.endpoint;
    this.body = options.body;
  }
}
