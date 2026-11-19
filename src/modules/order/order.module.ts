import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Order } from './entities/order.entity';
import { OrderService } from './order.service';
import { AuthModule } from '../auth/auth.module';
import { OrderController } from './order.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Order]), AuthModule],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [],
})
export class OrderModule {}
