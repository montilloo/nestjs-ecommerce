import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
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

  /**
   * ParseIntPipe 将路径参数转换成整数，无法转换时返回 400
   * `UpdateProductDto` 配合已有全局校验检查请求体。
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductDto,
  ): Promise<Product> {
    return this.productService.update(id, dto);
  }
}
