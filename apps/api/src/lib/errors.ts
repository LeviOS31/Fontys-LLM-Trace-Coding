export class NotFoundError extends Error {
  status = 404;
  constructor(public message: string) {
    super(message);
  }
}
