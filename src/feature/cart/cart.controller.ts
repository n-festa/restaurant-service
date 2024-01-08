import { Controller, Inject } from '@nestjs/common';
import { CartService } from './cart.service';
import { FlagsmithService } from 'src/dependency/flagsmith/flagsmith.service';
import { MessagePattern } from '@nestjs/microservices';
import { AddToCartRequest } from './dto/add-to-cart-request.dto';
import { AddToCartResponse } from './dto/add-to-cart-response.dto';

@Controller()
export class CartController {
  constructor(
    @Inject('FLAGSMITH_SERVICE') private readonly flagService: FlagsmithService,
    private readonly cartService: CartService,
  ) {}
  @MessagePattern({ cmd: 'add_cart_item' })
  async addCartItem(data: AddToCartRequest): Promise<AddToCartResponse> {
    if (this.flagService.isFeatureEnabled('fes-24-add-to-cart')) {
      return await this.cartService.addCartItem(data);
    }
  }
}
