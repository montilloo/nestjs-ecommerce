import { IsOptional, IsInt, Min, Max } from 'class-validator';

import { Type } from 'class-transformer';

export class QueryProductDto {
  @IsOptional()
  @Type(() => Number) // 把查询字符串转换成数字。
  @IsInt() // 验证是否是整数
  @Min(1) // 最小值
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
