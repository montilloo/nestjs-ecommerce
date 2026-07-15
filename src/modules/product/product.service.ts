import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { QueryProductDto } from './dto/query-product.dto';

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
      // 跳过多少条
      skip: (page - 1) * limit,
      // 取多少条
      take: limit,
    });
  }
}
