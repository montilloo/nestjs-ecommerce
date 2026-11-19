import { IsInt, Max, Min, IsUUID } from 'class-validator';

export class CreateOrderDto {
  @IsInt({ message: '商品 ID 必须是整数' })
  @Min(1, { message: '商品 ID 必须大于 0' })
  @Max(2147483647, { message: '商品 ID 不能大于 2147483647' })
  productId!: number;

  // 约定每次最多购买 100 件。请求中不接收用户 ID、价格或总金额：用户身份来自 JWT，金额由服务端计算。
  @IsInt({ message: '数量必须是整数' })
  @Min(1, { message: '数量不能小于 1' })
  @Max(100, { message: '数量不能大于 100' })
  quantity!: number;

  @IsUUID('4', { message: 'requestId 必须是有效的 UUID v4' })
  requestId!: string;
}
