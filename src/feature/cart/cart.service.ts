import { Inject, Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { FlagsmithService } from 'src/dependency/flagsmith/flagsmith.service';
import { EntityManager } from 'typeorm';
import { AddToCartResponse } from './dto/add-to-cart-response.dto';
import { AddToCartRequest } from './dto/add-to-cart-request.dto';

@Injectable()
export class CartService {
  constructor(
    @Inject('FLAGSMITH_SERVICE') private readonly flagService: FlagsmithService,
    @InjectEntityManager() private readonly entityManager: EntityManager,
  ) {}
  async addCartItem(inputData: AddToCartRequest): Promise<AddToCartResponse> {
    if (this.flagService.isFeatureEnabled('fes-24-add-to-cart')) {
      const res = new AddToCartResponse(200, '');

      //success
      res.statusCode = 200;
      //   res.message = 'Add to cart successfully';
      res.message = inputData;
      res.data = null;

      return res;
    }
  }
}
