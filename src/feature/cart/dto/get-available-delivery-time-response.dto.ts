import { GeneralResponse } from 'src/dto/general-response.dto';
import { TimeSlot } from 'src/type';

export class GetAvailableDeliveryTimeResponse extends GeneralResponse {
  data: TimeSlot[];
}
