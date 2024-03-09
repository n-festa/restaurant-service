export class CustomRpcException extends Error {
  constructor(
    public readonly error_code: number,
    public readonly detail: any,
  ) {
    super();
  }
}
