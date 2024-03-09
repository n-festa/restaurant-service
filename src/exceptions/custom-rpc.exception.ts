// import { RpcException } from '@nestjs/microservices';

// export class CustomRpcException extends RpcException {
//   constructor(
//     public readonly message: string,
//     public readonly errors?: any,
//   ) {
//     super(message);
//   }
// }
export class CustomRpcException extends Error {
  constructor(
    public readonly error_code: number,
    public readonly detail: any,
  ) {
    super();
  }
}
