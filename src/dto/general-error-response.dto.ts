export class GeneralErrorResponse {
  constructor(_error_code: number = 0, _detail: any = null) {
    this.error_code = _error_code;
    this.detail = _detail;
    return this;
  }
  error_code: number;
  detail: any;
}
