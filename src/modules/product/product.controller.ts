import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';

import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { Product } from './entities/product.entity';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';

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
}
