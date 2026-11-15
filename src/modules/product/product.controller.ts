import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';

import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { Product } from './entities/product.entity';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('products')
@UseGuards(RolesGuard)
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @Roles('admin')
  create(@Body() dto: CreateProductDto): Promise<Product> {
    return this.productService.create(dto);
  }

  @Get()
  findAll(@Query() query: QueryProductDto): Promise<Product[]> {
    return this.productService.findAll(query);
  }

  @Get('available')
  findAvailableProducts(@Query() query: QueryProductDto): Promise<Product[]> {
    const { page = 1, limit = 10 } = query;
    return this.productService.findAvailableProducts(page, limit);
  }

  @Get('test-error')
  testError() {
    // throw new NotFoundException('商品不存在');
    // throw new BadRequestException('参数错误');
    throw new Error('数据库连接失败');
  }
}
