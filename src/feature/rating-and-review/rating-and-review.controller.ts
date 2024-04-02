import { Controller, HttpException, UseFilters } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { GetTopReviewResponse } from './dto/get-top-review-response.dto';
import { Review } from 'src/type';
import { RatingAndReviewService } from './rating-and-review.service';
import { GetReviewFormResponse } from './dto/get-review-form-response.dto';
import { CustomRpcExceptionFilter } from 'src/filters/custom-rpc-exception.filter';
import { CreateOrderReviewResponse } from './dto/create-review-response.dto';

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
  @MessagePattern({ cmd: 'get_review_form' })
  @UseFilters(new CustomRpcExceptionFilter())
  async getReviewForm(
    data: GetReviewFormRequest,
  ): Promise<GetReviewFormResponse> {
    return await this.ratingAndReviewService.getReviewForm(data);
  }

  @MessagePattern({ cmd: 'create_review_form' })
  @UseFilters(new CustomRpcExceptionFilter())
  async postReviewForm(
    data: PostReviewRequest,
  ): Promise<CreateOrderReviewResponse> {
    // const res = new GetpReviewFormResponse(200, '');

    // try {
    await this.ratingAndReviewService.createReview(data);
    return { message: 'Create review successfully' };
    //   res.statusCode = 200;
    //   res.message = 'Create review successfully';
    // } catch (error) {
    //   if (error instanceof HttpException) {
    //     res.statusCode = error.getStatus();
    //     res.message = error.getResponse();
    //     res.data = null;
    //   } else {
    //     res.statusCode = 500;
    //     res.message = error.toString();
    //     res.data = null;
    //   }
    // }
    // return res;
  }
}
