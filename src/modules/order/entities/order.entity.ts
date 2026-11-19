import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Product } from '../../product/entities/product.entity';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  userId!: number;

  // 关联到 User 实体，表示订单属于哪个用户。多个订单可以属于同一用户。RESTRICT 表示有订单引用时，不允许直接删除对应用户或商品。
  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column()
  productId!: number;

  // 关联到 Product 实体，表示订单中购买的商品。多个订单可以购买同一商品。RESTRICT 表示有订单引用时，不允许直接删除对应用户或商品。
  @ManyToOne(() => Product, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'productId' })
  product!: Product;

  @Column()
  quantity!: number;

  @Column({ length: 100 })
  productName!: string;

  // 金额用字符串接收：保留 MySQL decimal 的精确十进制表示。下一步计算总金额时会专门处理，不能直接将字符串相乘。
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitPrice!: string;

  // 金额用字符串接收：保留 MySQL decimal 的精确十进制表示。下一步计算总金额时会专门处理，不能直接将字符串相乘。
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount!: string;

  @Column({
    type: 'enum',
    enum: ['pending', 'paid', 'cancelled'],
    default: 'pending',
  })
  status!: 'pending' | 'paid' | 'cancelled';

  @CreateDateColumn()
  createdAt!: Date;
}
