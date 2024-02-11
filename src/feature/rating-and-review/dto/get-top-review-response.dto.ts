import { GeneralResponse } from 'src/dto/general-response.dto';

export class GetTopReviewResponse extends GeneralResponse {
  data: Review[];
}
interface Review {
  food_rating_id: number;
  score: number;
  remarks: string;
  reviewer_name?: string;
  reviewer_title?: string;
  reviewer_img?: string;
}
