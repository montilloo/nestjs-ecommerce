import { Repository } from 'typeorm';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async create(dto: CreateProductDto): Promise<Product> {
    // 生成 Entity 对象
    const product = this.productRepository.create(dto);
    // 执行 SQL。
    return this.productRepository.save(product);
  }

  async findAll(query: QueryProductDto): Promise<Product[]> {
    const { page = 1, limit = 10 } = query;
    return this.productRepository.find({
      order: {
        createdAt: 'DESC',
        id: 'DESC',
      },
      /**
       * 可以理解为下面的SQL语句：
       * SELECT *
          FROM products
          ORDER BY createdAt DESC, id DESC
          LIMIT 10 OFFSET 0;
       */
      // 跳过多少条
      skip: (page - 1) * limit,
      // 取多少条
      take: limit,
    });
  }
  /**
   * 可售商品列表
   * @param page 页数
   * @param limit 每页条数
   * @returns 商品列表
   */
  async findAvailableProducts(page = 1, limit = 10): Promise<Product[]> {
    return this.productRepository
      .createQueryBuilder('product')
      .where('product.status = :status', { status: 1 })
      .andWhere('product.stock > :stock', { stock: 0 })
      .orderBy('product.createdAt', 'DESC')
      .addOrderBy('product.id', 'DESC') // 这里用 addOrderBy：它是在原排序后追加条件；再次调用 orderBy 会覆盖之前的排序
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();
  }

  async update(id: number, dto: UpdateProductDto): Promise<Product> {
    return this.productRepository.manager.transaction(
      'READ COMMITTED',
      async (manager) => {
        const product = await manager.findOne(Product, {
          where: { id },
          lock: { mode: 'pessimistic_write' },
        });

        if (!product) {
          throw new NotFoundException(`商品不存在，id: ${id}`);
        }

        manager.merge(Product, product, dto);

        return manager.save(Product, product);
      },
    );
  }
}
