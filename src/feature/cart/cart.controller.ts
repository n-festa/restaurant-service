import { Controller, HttpException, Inject } from '@nestjs/common';
import { CartService } from './cart.service';
import { FlagsmithService } from 'src/dependency/flagsmith/flagsmith.service';
import { MessagePattern } from '@nestjs/microservices';
import { AddToCartRequest } from './dto/add-to-cart-request.dto';
import { AddToCartResponse } from './dto/add-to-cart-response.dto';
import { UpdateCartAdvancedRequest } from './dto/update-cart-advanced-request.dto';
import { UpdateCartAdvancedResponse } from './dto/update-cart-advanced-response.dto';
import { GetCartDetailResponse } from './dto/get-cart-detail-response.dto';
import { UpdateCartBasicRequest } from './dto/update-cart-basic-request.dto';
import { UpdateCartBasicResponse } from './dto/update-cart-basic-response.dto';
import { DeleteCartItemRequest } from './dto/delete-cart-item-request.dto';
import { DeleteCartItemResponse } from './dto/delete-cart-item-response.dto';
import { GeneralResponse } from 'src/dto/general-response.dto';
import { CommonService } from '../common/common.service';
import { FullCartItem, RestaurantBasicInfo, TimeSlot } from 'src/type';
import { GetAvailableDeliveryTimeRequest } from './dto/get-available-delivery-time-request.dto';
import { GetAvailableDeliveryTimeResponse } from './dto/get-available-delivery-time-response.dto';
import { QuickAddToCartRequest } from './dto/quick-add-to-cart-request.dto';
import { QuickAddToCartResponse } from './dto/quick-add-to-cart-response.dto';
import { HttpStatusCode } from 'axios';

@Controller()
export class CartController {
  constructor(
    @Inject('FLAGSMITH_SERVICE') private readonly flagService: FlagsmithService,
    private readonly cartService: CartService,
    private readonly commonService: CommonService,
  ) {}
  @MessagePattern({ cmd: 'add_cart_item' })
  async addCartItem(data: AddToCartRequest): Promise<AddToCartResponse> {
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

      let restaurant: RestaurantBasicInfo = {
        id: null,
        name: [],
        logo_url: null,
      };
      if (cart.length > 0) {
        restaurant = await this.commonService.getRestaurantBasicInfo(
          cart[0].restaurant_id,
        );
      }
      //success
      res.statusCode = 200;
      res.message = 'Add to cart successfully';
      res.data = {
        customer_id: customer_id,
        restaurant_id: restaurant.id,
        restaurant_name: restaurant.name,
        restaurant_logo_img: restaurant.logo_url,
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
  } // end of addCartItem

  @MessagePattern({ cmd: 'get_cart_detail' })
  async getCartDetail(customer_id: number): Promise<GetCartDetailResponse> {
    const res = new GetCartDetailResponse(200, '');

    try {
      const cartItems: FullCartItem[] =
        await this.cartService.getCart(customer_id);
      let restaurant: RestaurantBasicInfo = {
        id: null,
        name: [],
        logo_url: null,
      };
      if (cartItems.length > 0) {
        restaurant = await this.commonService.getRestaurantBasicInfo(
          cartItems[0].restaurant_id,
        );
      }

      res.statusCode = 200;
      res.message = 'Get cart detail successfully';
      res.data = {
        customer_id: customer_id,
        restaurant_id: restaurant.id,
        restaurant_name: restaurant.name,
        restaurant_logo_img: restaurant.logo_url,
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
  } // end of getCartDetail

  @MessagePattern({ cmd: 'update_cart_advanced' })
  async updateCartAdvanced(
    data: UpdateCartAdvancedRequest,
  ): Promise<UpdateCartAdvancedResponse> {
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
      const cartItems: FullCartItem[] =
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
      let restaurant: RestaurantBasicInfo = {
        id: null,
        name: [],
        logo_url: null,
      };
      if (cartItems.length > 0) {
        restaurant = await this.commonService.getRestaurantBasicInfo(
          cartItems[0].restaurant_id,
        );
      }
      res.statusCode = 200;
      res.message = 'Update cart successfully';
      res.data = {
        customer_id: data.customer_id,
        restaurant_id: restaurant.id,
        restaurant_name: restaurant.name,
        restaurant_logo_img: restaurant.logo_url,
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
  } // end of updateCartAdvanced

  @MessagePattern({ cmd: 'update_cart_basic' })
  async updateCartBasic(
    data: UpdateCartBasicRequest,
  ): Promise<UpdateCartBasicResponse> {
    const { customer_id, updated_items } = data;
    const res = new UpdateCartBasicResponse(200, '');
    try {
      const cartItems: FullCartItem[] =
        await this.cartService.updateCartBasicFromEndPoint(
          customer_id,
          updated_items,
        );
      let restaurant: RestaurantBasicInfo = {
        id: null,
        name: [],
        logo_url: null,
      };
      if (cartItems.length > 0) {
        restaurant = await this.commonService.getRestaurantBasicInfo(
          cartItems[0].restaurant_id,
        );
      }
      res.statusCode = 200;
      res.message = 'Update cart successfully';
      res.data = {
        customer_id: data.customer_id,
        restaurant_id: restaurant.id,
        restaurant_name: restaurant.name,
        restaurant_logo_img: restaurant.logo_url,
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
  } // end of updateCartBasic

  @MessagePattern({ cmd: 'delete_cart_items' })
  async deleteCartItems(
    requestData: DeleteCartItemRequest,
  ): Promise<DeleteCartItemResponse> {
    const { customer_id, cart_items } = requestData;
    const res = new DeleteCartItemResponse(200, '');
    try {
      const cart = await this.cartService.deleteCartItemsFromEndPoint(
        customer_id,
        cart_items,
      );

      let restaurant: RestaurantBasicInfo = {
        id: null,
        name: [],
        logo_url: null,
      };
      if (cart.length > 0) {
        restaurant = await this.commonService.getRestaurantBasicInfo(
          cart[0].restaurant_id,
        );
      }
      res.statusCode = 200;
      res.message = 'Delete cart items successfully';
      res.data = {
        customer_id: customer_id,
        restaurant_id: restaurant.id,
        restaurant_name: restaurant.name,
        restaurant_logo_img: restaurant.logo_url,
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
  } // end of deleteCartItems

  @MessagePattern({ cmd: 'delete_all_cart_item' })
  async deleteAllCartItem(customer_id: number): Promise<GeneralResponse> {
    const res = new GeneralResponse(200, '');
    try {
      await this.cartService.deleteAllCartItem(customer_id);
      res.statusCode = 200;
      res.message = 'Delete all cart items successfully';
      res.data = null;
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
  } // end of deleteAllCartItem

  @MessagePattern({ cmd: 'get_available_delivery_time' })
  async getAvailableDeliveryTime(
    data: GetAvailableDeliveryTimeRequest,
  ): Promise<GetAvailableDeliveryTimeResponse> {
    const res = new GetAvailableDeliveryTimeResponse(200, '');
    const { menu_item_ids, now, long, lat, utc_offset } = data;

    try {
      const timeSlots: TimeSlot[] =
        await this.cartService.getAvailableDeliveryTimeFromEndPoint(
          menu_item_ids,
          now,
          long,
          lat,
          utc_offset,
        );
      res.statusCode = 200;
      res.message = 'Get available delivery time successfully';
      res.data = timeSlots;
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
  } // end of getAvailableDeliveryTime

  @MessagePattern({ cmd: 'quick_add_to_cart' })
  async quickAddToCart(
    data: QuickAddToCartRequest,
  ): Promise<QuickAddToCartResponse> {
    const res = new QuickAddToCartResponse(200, '');
    const { customer_id, menu_item_id } = data;

    // get standard SKUs for menu_item_id
    const sku = await this.commonService.getStandardSkuByMenuItem(menu_item_id);
    if (!sku) {
      res.statusCode = HttpStatusCode.NotFound;
      res.message = 'Standard SKU for the menu item does not exist';
      res.data = null;
      return res;
    }

    const qtyOrdered = 1;

    try {
      const cart = await this.cartService.addCartItem(
        customer_id,
        sku.sku_id,
        qtyOrdered,
      );

      let restaurant: RestaurantBasicInfo = {
        id: null,
        name: [],
        logo_url: null,
      };
      if (cart.length > 0) {
        restaurant = await this.commonService.getRestaurantBasicInfo(
          cart[0].restaurant_id,
        );
      }
      //success
      res.statusCode = 200;
      res.message = 'Quick-add to cart successfully';
      res.data = {
        customer_id: customer_id,
        restaurant_id: restaurant.id,
        restaurant_name: restaurant.name,
        restaurant_logo_img: restaurant.logo_url,
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
  } // end of quickAddToCart
}
