import { Controller, HttpException } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { GetTopReviewResponse } from './dto/get-top-review-response.dto';
import { Review } from 'src/type';
import { RatingAndReviewService } from './rating-and-review.service';

@Controller()
export class RatingAndReviewController {
  constructor(
    private readonly ratingAndReviewService: RatingAndReviewService,
  ) {}
  @MessagePattern({ cmd: 'get_top_review' })
  async getTopReview(): Promise<GetTopReviewResponse> {
    const res = new GetTopReviewResponse(200, '');

    try {
      const reviews: Review[] =
        await this.ratingAndReviewService.getTopReviewFromEndPoint();
      res.statusCode = 200;
      res.message = 'Get top review successfully';
      res.data = reviews;
    } catch (error) {
      if (error instanceof HttpException) {
        res.statusCode = error.getStatus();
        res.message = error.getResponse();
        res.data = null;
      } else {
        res.statusCode = 500;
        res.message = error.toString();
        res.data = null;
      }
    }
    return res;
  }
}
