import { Controller, HttpException, Inject } from '@nestjs/common';
import { CartService } from './cart.service';
import { FlagsmithService } from 'src/dependency/flagsmith/flagsmith.service';
import { MessagePattern } from '@nestjs/microservices';
import { AddToCartRequest } from './dto/add-to-cart-request.dto';
import { AddToCartResponse } from './dto/add-to-cart-response.dto';
import { UpdateCartAdvancedRequest } from './dto/update-cart-advanced-request.dto';
import { UpdateCartAdvancedResponse } from './dto/update-cart-advanced-response.dto';
import { GetCartDetailResponse } from './dto/get-cart-detail-response.dto';
import { CartItem } from 'src/entity/cart-item.entity';
import { UpdateCartBasicRequest } from './dto/update-cart-basic-request.dto';
import { UpdateCartBasicResponse } from './dto/update-cart-basic-response.dto';
import { DeleteCartItemRequest } from './dto/delete-cart-item-request.dto';
import { DeleteCartItemResponse } from './dto/delete-cart-item-response.dto';

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

  @MessagePattern({ cmd: 'get_cart_detail' })
  async getCartDetail(customer_id: number): Promise<GetCartDetailResponse> {
    if (this.flagService.isFeatureEnabled('fes-27-get-cart-info')) {
      const res = new GetCartDetailResponse(200, '');

      try {
        const cartItems: CartItem[] =
          await this.cartService.getCart(customer_id);
        res.statusCode = 200;
        res.message = 'Get cart detail successfully';
        res.data = {
          customer_id: customer_id,
          cart_info: cartItems,
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
        return res;
      }

      return res;
    }
  }

  @MessagePattern({ cmd: 'update_cart_advanced' })
  async updateCartAdvanced(
    data: UpdateCartAdvancedRequest,
  ): Promise<UpdateCartAdvancedResponse> {
    if (this.flagService.isFeatureEnabled('fes-28-update-cart')) {
      const {
        customer_id,
        item_id,
        sku_id,
        qty_ordered,
        advanced_taste_customization_obj,
        basic_taste_customization_obj,
        notes,
        lang = 'vie',
      } = data;
      const res = new UpdateCartAdvancedResponse(200, '');
      try {
        const cartItems: CartItem[] =
          await this.cartService.updateCartAdvancedFromEndPoint(
            customer_id,
            item_id,
            sku_id,
            qty_ordered,
            advanced_taste_customization_obj,
            basic_taste_customization_obj,
            notes,
            lang,
          );
        res.statusCode = 200;
        res.message = 'Update cart successfully';
        res.data = {
          customer_id: data.customer_id,
          cart_info: cartItems,
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

  @MessagePattern({ cmd: 'update_cart_basic' })
  async updateCartBasic(
    data: UpdateCartBasicRequest,
  ): Promise<UpdateCartBasicResponse> {
    if (this.flagService.isFeatureEnabled('fes-28-update-cart')) {
      const { customer_id, updated_items } = data;
      const res = new UpdateCartAdvancedResponse(200, '');
      try {
        const cartItems: CartItem[] =
          await this.cartService.updateCartBasicFromEndPoint(
            customer_id,
            updated_items,
          );
        res.statusCode = 200;
        res.message = 'Update cart successfully';
        res.data = {
          customer_id: data.customer_id,
          cart_info: cartItems,
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

  @MessagePattern({ cmd: 'delete_cart_items' })
  async deleteCartItems(
    requestData: DeleteCartItemRequest,
  ): Promise<DeleteCartItemResponse> {
    if (this.flagService.isFeatureEnabled('fes-37-delete-some-of-cart-items')) {
      const { customer_id, cart_items } = requestData;
      const res = new DeleteCartItemResponse(200, '');
      try {
        const cart = await this.cartService.deleteCartItemsFromEndPoint(
          customer_id,
          cart_items,
        );
        res.statusCode = 200;
        res.message = 'Delete cart items successfully';
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
