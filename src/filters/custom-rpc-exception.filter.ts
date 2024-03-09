import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { CustomRpcException } from 'src/exceptions/custom-rpc.exception';

@Catch(CustomRpcException)
export class CustomRpcExceptionFilter implements ExceptionFilter {
  catch(exception: CustomRpcException, host: ArgumentsHost): Observable<any> {
    return throwError(() => exception);
  }
}
