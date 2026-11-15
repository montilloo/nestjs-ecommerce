import {
  IsIn,
  IsInt,
  IsNumber,
  IsString,
  Length,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';

export class UpdateProductDto {
  @ValidateIf((_, value) => value !== undefined) // 仅在值不为 undefined 时进行验证.只有字段没传时，才跳过校验。
  @IsString({ message: '商品名称必须是字符串' })
  @Length(1, 100, { message: '商品名称长度必须在1到100个字符之间' })
  name?: string;

  @ValidateIf((_, value) => value !== undefined)
  @IsString({ message: '商品描述必须是字符串' })
  description?: string;

  @ValidateIf((_, value) => value !== undefined)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: '商品价格必须是数字，且最多两位小数' },
  )
  @Min(0, { message: '商品价格必须大于等于0' })
  @Max(99999999.99, { message: '商品价格必须小于等于99999999.99' })
  price?: number;

  @ValidateIf((_, value) => value !== undefined)
  @IsInt({ message: '商品库存必须是整数' })
  @Min(0, { message: '商品库存必须大于等于0' })
  @Max(2147483647, { message: '商品库存必须小于等于2147483647' })
  stock?: number;

  @ValidateIf((_, value) => value !== undefined)
  @IsInt({ message: '商品状态必须是整数' })
  @IsIn([0, 1], { message: '商品状态必须是0（下架）或1（上架）' })
  status?: number;
}
