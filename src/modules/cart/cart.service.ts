import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { User } from '../users/entities/user.entity';
import { Product, ProductStatus } from '../products/entities/product.entity';
import { OrderService } from '../order/order.service';
import { CreateOrderDto } from '../order/dto/create-order.dto';
import { Order } from '../order/entities/order.entity';
import { ParamIdDto } from 'src/shared/dtos/paramId.dto';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private cartRepository: Repository<Cart>,

    @InjectRepository(CartItem)
    private cartItemRepository: Repository<CartItem>,

    @InjectRepository(Product)
    private productRepository: Repository<Product>,

    private orderService: OrderService,
  ) {}

  async getOrCreateCart(user: User): Promise<Cart> {
    let cart = await this.cartRepository.findOne({
      where: { user: { id: user.id } },
      relations: {
        items:{
            product:true
        },
        user:true
      },
    });

    if (!cart) {
      cart = this.cartRepository.create({
        user: user,
        subtotal: 0,
        total_amount: 0,
        total_items: 0,
      });
      await this.cartRepository.save(cart);
    }

    return cart;
  }

  async addToCart(addToCartDto: AddToCartDto, user: User): Promise<Cart> {
    const { product_id, quantity, metadata } = addToCartDto;

    // Check if product exists and is active
    const product = await this.productRepository.findOne({
      where: { id: product_id, status: ProductStatus.ACTIVE },
    });

    if (!product) {
      throw new NotFoundException('Product not found or inactive');
    }

    const cart = await this.getOrCreateCart(user);

    // Check if item already exists in cart
    let cartItem = await this.cartItemRepository.findOne({
      where: { cart: { id: cart.id }, product: { id: product_id } },
    });

    if (cartItem) {
      // Update existing item quantity
      cartItem.quantity += quantity;
      cartItem.total_price = cartItem.quantity * product.price_per_ip;
      cartItem.metadata = { ...cartItem.metadata, ...metadata };
      await this.cartItemRepository.save(cartItem);
    } else {
      // Create new cart item
      cartItem = this.cartItemRepository.create({
        cart: cart,
        product: product,
        quantity: quantity,
        unit_price: product.price_per_ip,
        total_price: product.price_per_ip * quantity,
        metadata: metadata,
      });
      await this.cartItemRepository.save(cartItem);
    }

    // Update cart totals
    await this.updateCartTotals(cart.id);

    return await this.getOrCreateCart(user);
  }

  async updateCartItem(paramIdDto: ParamIdDto, updateCartItemDto: UpdateCartItemDto, user: User): Promise<Cart> {
    const cartItem = await this.cartItemRepository.findOne({
      where: { id: paramIdDto.id },
      relations: {
        cart:{
            user:true,
        },
        product:true
      },
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    if (cartItem.cart.user.id !== user.id) {
      throw new BadRequestException('You can only update your own cart items');
    }

    if (updateCartItemDto.quantity !== undefined) {
      cartItem.quantity = updateCartItemDto.quantity;
      cartItem.total_price = cartItem.quantity * cartItem.product.price_per_ip;
    }

    if (updateCartItemDto.metadata !== undefined) {
      cartItem.metadata = { ...cartItem.metadata, ...updateCartItemDto.metadata };
    }

    await this.cartItemRepository.save(cartItem);

    // Update cart totals
    await this.updateCartTotals(cartItem.cart.id);

    return await this.getOrCreateCart(user);
  }

    async removeFromCart(paramIdDto: ParamIdDto, user: User): Promise<Cart> {
    const cartItem = await this.cartItemRepository.findOne({
      where: { id: paramIdDto.id },
      relations: {
        cart:{
            user:true
        }
      },
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    if (cartItem.cart.user.id !== user.id) {
      throw new BadRequestException('You can only remove items from your own cart');
    }

    await this.cartItemRepository.remove(cartItem);

    // Update cart totals
    await this.updateCartTotals(cartItem.cart.id);

    return await this.getOrCreateCart(user);
  }

  async clearCart(user: User): Promise<Cart> {
    const cart = await this.getOrCreateCart(user);
    
    await this.cartItemRepository.delete({ cart: { id: cart.id } });
    
    // Reset cart totals
    await this.updateCartTotals(cart.id);

    return await this.getOrCreateCart(user);
  }

  async getCart(user: User): Promise<Cart> {
    return await this.getOrCreateCart(user);
  }

  async checkout(checkoutDto: any, user: User): Promise<any> {
    const cart = await this.getOrCreateCart(user);

    if (cart.total_items === 0) {
      throw new BadRequestException('Cart is empty');
    }

    if (!user.cryptomus_wallet) {
      throw new BadRequestException('You do not have a cryptomus wallet');
    }

    if (user.cryptomus_wallet.balance < cart.total_amount) {
      throw new BadRequestException('Insufficient balance in your wallet');
    }

    try {
      // Create one order with all cart items
      const createOrderDto = {
        items: cart.items.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
          metadata: item.metadata,
        })),
        notes: checkoutDto.notes,
        metadata: { ...checkoutDto.metadata, source: 'cart_checkout' },
      };

      const order = await this.orderService.create(createOrderDto, user);

      // Clear cart after successful checkout
      await this.clearCart(user);

      return {
        message: 'Checkout successful',
        order: order,
        total_amount: cart.total_amount,
      };
    } catch (error) {
      throw new BadRequestException({
        message: 'Checkout failed',
        error: error.message,
      });
    }
  }

  private async updateCartTotals(cartId: string): Promise<void> {
    const cart = await this.cartRepository.findOne({
      where: { id: cartId },
      relations: {
        items:{
            product:true
        }
      },
    });

    if (!cart) return;

    let subtotal = 0;
    let totalItems = 0;

    for (const item of cart.items) {
      subtotal += Number(item.total_price);
      totalItems += item.quantity;
    }

    cart.subtotal = Number(subtotal.toFixed(2));
    cart.total_amount = Number((Number(subtotal) + Number(cart.tax_amount) - Number(cart.discount_amount)).toFixed(2));
    cart.total_items = totalItems;

    await this.cartRepository.save(cart);
  }
}
