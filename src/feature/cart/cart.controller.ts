import { Controller, HttpException, Inject } from '@nestjs/common';
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
      const {
        customer_id,
        sku_id,
        qty_ordered,
        advanced_taste_customization_obj,
        basic_taste_customization_obj,
        notes,
      } = data;
      const res = new AddToCartResponse(200, '');
      try {
        const cart = await this.cartService.addCartItem(
          customer_id,
          sku_id,
          qty_ordered,
          advanced_taste_customization_obj,
          basic_taste_customization_obj,
          notes,
        );
        //success
        res.statusCode = 200;
        res.message = 'Add to cart successfully';
        res.data = {
          customer_id: customer_id,
          cart_info: cart,
        };
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
}
