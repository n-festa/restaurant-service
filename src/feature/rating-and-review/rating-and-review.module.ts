import { Module } from '@nestjs/common';
import { RatingAndReviewController } from './rating-and-review.controller';
import { RatingAndReviewService } from './rating-and-review.service';

@Module({
  imports: [],
  controllers: [RatingAndReviewController],
  providers: [RatingAndReviewService],
  exports: [RatingAndReviewService],
})
export class RatingAndReviewModule {}
