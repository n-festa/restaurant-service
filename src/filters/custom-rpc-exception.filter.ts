import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  NotFoundException,
  RpcExceptionFilter,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Request, Response } from 'express';
import { Observable, of, throwError } from 'rxjs';
import { CustomRpcException } from 'src/exceptions/custom-rpc.exception';

@Catch(CustomRpcException)
export class CustomRpcExceptionFilter implements ExceptionFilter {
  catch(exception: CustomRpcException, host: ArgumentsHost): Observable<any> {
    return throwError(() => exception);
  }
}

// @Catch(RpcException)
// export class CustomRpcExceptionFilter
//   implements RpcExceptionFilter<RpcException>
// {
//   catch(exception: RpcException, host: ArgumentsHost): Observable<any> {
//     return throwError(() => exception.getError());
//   }
// }
