import { BadRequestException } from '@nestjs/common';
import { GeneralErrorResponse } from 'src/dto/general-error-response.dto';

export class CustomBadRequestException extends BadRequestException {
  constructor(public readonly error_response: GeneralErrorResponse) {
    super(error_response);
  }
}
