interface PostReviewRequest {
  customer_id: number;
  order_id: number;
  driver_review: DriverReview;
  food_reviews: FoodReview[];
}

interface DriverReview {
  driver_id: number;
  score: number; // from 1-5
  remarks: string;
  img_urls: string[];
}

interface FoodReview {
  order_sku_id: number;
  score: number; // from 1-5
  remarks: string;
  img_urls: string[];
}

interface GetReviewFormRequest {
  customer_id: number;
  order_id: number;
}
