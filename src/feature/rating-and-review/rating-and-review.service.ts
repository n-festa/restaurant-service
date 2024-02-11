import { Injectable } from '@nestjs/common';
import { readFileSync } from 'fs';
import { Review } from 'src/type';

@Injectable()
export class RatingAndReviewService {
  constructor() {}
  async getTopReviewFromEndPoint(): Promise<Review[]> {
    const reviews: Review[] = [];
    const filePath = 'src/fake_data/top-reviews.json';
    const fileContent = readFileSync(filePath, 'utf-8');
    const data: Review[] = JSON.parse(fileContent);
    reviews.push(...data);
    return reviews;
  }
}
