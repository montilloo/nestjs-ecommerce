import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import { Product } from '../product/entities/product.entity';
import { Order } from './entities/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrderService {
  constructor(private readonly dataSource: DataSource) {}

  async create(userId: number, dto: CreateOrderDto): Promise<Order> {
    // 所有数据库操作都使用事务回调提供的 manager。
    // 不要在中途调用现有 ProductService 或使用外部 Repository，否则可能脱离当前事务。
    // 请求 A：取得锁 → 读到库存 1 → 扣为 0 → 创建订单 → 提交释放锁
    // 请求 B：等待锁 → 取得锁后读到库存 0 → 抛出“库存不足”
    return this.dataSource.transaction(async (manager) => {
      const product = await manager.findOne(Product, {
        where: { id: dto.productId },
        lock: { mode: 'pessimistic_write' }, // 悲观锁：在事务中锁定商品记录，防止其他事务修改库存。pessimistic_write 在 MySQL 中对查询到的商品记录加写锁，直到事务提交或回滚才释放
      });

      if (!product) {
        throw new NotFoundException('商品不存在');
      }

      if (product.status !== 1) {
        throw new ConflictException('商品已下架');
      }

      if (product.stock < dto.quantity) {
        throw new ConflictException('库存不足');
      }

      // 当前product.price已经转换为number，按其两位小数恢复单价
      const unitPrice = product.price.toFixed(2);

      // 转成整数‘分’进行计算，避免浮点数精度问题
      const unitPriceInCents = BigInt(unitPrice.replace('.', ''));
      const totalInCents = unitPriceInCents * BigInt(dto.quantity);

      const totalAmount = `${totalInCents / 100n}.${(totalInCents % 100n).toString().padStart(2, '0')}`;

      product.stock -= dto.quantity;
      await manager.save(Product, product);

      const order = manager.create(Order, {
        userId,
        productId: product.id,
        quantity: dto.quantity,
        productName: product.name,
        unitPrice,
        totalAmount,
        status: 'pending',
      });
      return manager.save(Order, order);
    });
  }
}
