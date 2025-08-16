import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { CheckoutDto } from './dto/checkout.dto';
import { AuthenticationGuard } from '../../shared/guards/authentication.guard';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { ParamIdDto } from 'src/shared/dtos/paramId.dto';
import { IResponse } from 'src/shared/interfaces/response.interface';

@Controller('cart')
@UseGuards(AuthenticationGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @UseGuards(AuthenticationGuard)
  async getCart(@CurrentUser() user: User): Promise<IResponse> {
    const cart = await this.cartService.getCart(user);
    return {
      message: 'Cart fetched successfully',
      details: cart,
    };
  }

  @Post('add')
  @UseGuards(AuthenticationGuard)
  async addToCart(
    @Body() addToCartDto: AddToCartDto,
    @CurrentUser() user: User,
  ): Promise<IResponse> {
    const cart = await this.cartService.addToCart(addToCartDto, user);
    return {
      message: 'Item added to cart successfully',
      details: cart,
    };
  }

  @Put('item/:id')
  @UseGuards(AuthenticationGuard)
  async updateCartItem(
    @Param() paramIdDto: ParamIdDto,
    @Body() updateCartItemDto: UpdateCartItemDto,
    @CurrentUser() user: User,
  ): Promise<IResponse> {
    const cart = await this.cartService.updateCartItem(paramIdDto, updateCartItemDto, user);
    return {
      message: 'Cart item updated successfully',
      details: cart,
    };
  }

  @Delete('item/:id')
  @UseGuards(AuthenticationGuard)
  async removeFromCart(
    @Param() paramIdDto: ParamIdDto,
    @CurrentUser() user: User,
  ): Promise<IResponse> {
    const cart = await this.cartService.removeFromCart(paramIdDto, user);
    return {
      message: 'Item removed from cart successfully',
      details: cart,
    };
  }

  @Delete('clear')
  @UseGuards(AuthenticationGuard)
  async clearCart(@CurrentUser() user: User): Promise<IResponse> {
    const cart = await this.cartService.clearCart(user);
    return {
      message: 'Cart cleared successfully',
      details: cart,
    };
  }

  @Post('checkout')
  @UseGuards(AuthenticationGuard)
  async checkout(
    @Body() checkoutDto: CheckoutDto,
    @CurrentUser() user: User,
  ): Promise<IResponse> {
    const checkout = await this.cartService.checkout(checkoutDto, user);
    return {
      message: 'Checkout successful',
      details: checkout,
    };
  }
}
