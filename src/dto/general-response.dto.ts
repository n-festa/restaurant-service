export class GeneralResponse {
  constructor(statusCode: number, message: any) {
    this.statusCode = statusCode;
    this.message = message;
    this.data = null;
  }

  statusCode: number;
  message: any;
  data: any;
}
