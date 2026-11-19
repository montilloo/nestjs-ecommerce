import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, QueryFailedError } from 'typeorm';

import { Product } from '../product/entities/product.entity';
import { Order } from './entities/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrderService {
  constructor(private readonly dataSource: DataSource) {}

  private checkReplay(order: Order, dto: CreateOrderDto): Order {
    if (order.productId !== dto.productId || order.quantity !== dto.quantity) {
      throw new ConflictException('该 requestId 已用于另一笔下单请求');
    }

    return order;
  }

  async create(userId: number, dto: CreateOrderDto): Promise<Order> {
    const key = {
      userId,
      requestId: dto.requestId.toLowerCase(),
    };
    // 快速处理已经成功过的请求，不再检查当前库存或价格
    const existing = await this.dataSource.getRepository(Order).findOneBy(key);

    if (existing) {
      return this.checkReplay(existing, dto);
    }
    try {
      // 所有数据库操作都使用事务回调提供的 manager。
      // 不要在中途调用现有 ProductService 或使用外部 Repository，否则可能脱离当前事务。
      // 请求 A：取得锁 → 读到库存 1 → 扣为 0 → 创建订单 → 提交释放锁
      // 请求 B：等待锁 → 取得锁后读到库存 0 → 抛出“库存不足”
      return await this.dataSource.transaction(
        'READ COMMITTED', // 本次明确使用 READ COMMITTED，让事务中的普通查询读取查询开始时已提交的数据，便于取得锁后看到另一个请求刚提交的订单
        async (manager) => {
          const product = await manager.findOne(Product, {
            where: { id: dto.productId },
            lock: { mode: 'pessimistic_write' }, // 悲观锁：在事务中锁定商品记录，防止其他事务修改库存。pessimistic_write 在 MySQL 中对查询到的商品记录加写锁，直到事务提交或回滚才释放
          });

          // 等待商品锁期间，另一个相同请求可能已经提交
          const replay = await manager.findOneBy(Order, key);

          if (replay) {
            return this.checkReplay(replay, dto);
          }

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
            ...key,
            userId,
            productId: product.id,
            quantity: dto.quantity,
            productName: product.name,
            unitPrice,
            totalAmount,
            status: 'pending',
          });
          return manager.save(Order, order);
        },
      );
    } catch (error) {
      const code =
        error instanceof QueryFailedError
          ? (error.driverError as { code?: string }).code
          : undefined;

      if (code === 'ER_DUP_ENTRY') {
        // 此时失败事务已经回滚，之前的库存扣减也已撤销
        const committed = await this.dataSource
          .getRepository(Order)
          .findOneBy(key);

        if (committed) {
          return this.checkReplay(committed, dto);
        }
      }
      // 其他数据库错误不能伪装成幂等成功
      throw error;
    }
  }
}
