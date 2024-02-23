import { NotFoundException } from '@nestjs/common';
import { GeneralErrorResponse } from 'src/dto/general-error-response.dto';

export class CustomNotFoundException extends NotFoundException {
  constructor(public readonly error_response: GeneralErrorResponse) {
    super(error_response);
  }
}
