import { Injectable } from '@nestjs/common';

@Injectable()
export class FoodService {
  getGeneralFoodRecomendation(): any {
    return {
      foodlist: [
        {
          foodId: 1,
          foodName: 'Pizza',
        },
        {
          foodId: 2,
          foodName: 'Ice-creame',
        },
      ],
    };
  }
}
