import { Module } from '@nestjs/common';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CartItem } from 'src/entity/cart-item.entity';
import { AhamoveModule } from 'src/dependency/ahamove/ahamove.module';

@Module({
  imports: [TypeOrmModule.forFeature([CartItem]), AhamoveModule],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}
