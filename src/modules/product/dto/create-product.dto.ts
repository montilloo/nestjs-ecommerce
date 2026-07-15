import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @IsNotEmpty({
    message: '商品名称不能为空',
  })
  @IsString({
    message: '商品名称必须是字符串',
  })
  name!: string;

  @IsOptional()
  @IsString({
    message: '商品描述必须是字符串',
  })
  description?: string;

  @IsNumber(
    {},
    {
      message: '价格必须是数字',
    },
  )
  @Min(0, {
    message: '价格不能小于0',
  })
  price!: number;

  @IsNumber(
    {},
    {
      message: '库存必须是数字',
    },
  )
  @Min(0, {
    message: '库存不能小于0',
  })
  stock!: number;
}
