import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { ProductService } from './product.service';
import { Product } from './entities/product.entity';

describe('ProductService.update', () => {
  let service: ProductService;

  const repository = {
    findOneBy: jest.fn(),
    merge: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        ProductService,
        {
          provide: getRepositoryToken(Product),
          useValue: repository,
        },
      ],
    }).compile();

    service = moduleRef.get(ProductService);
  });

  it('商品不存在时抛出 404，不执行保存', async () => {
    repository.findOneBy.mockResolvedValue(null);

    await expect(service.update(999, { stock: 0 })).rejects.toBeInstanceOf(
      NotFoundException,
    );

    expect(repository.findOneBy).toHaveBeenCalledWith({ id: 999 });
    expect(repository.merge).not.toHaveBeenCalled();
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('只更新库存时保留名称和价格，支持库存 0', async () => {
    const product = Object.assign(new Product(), {
      id: 5,
      name: '测试键盘',
      price: 99,
      stock: 100,
      status: 1,
    });

    repository.findOneBy.mockResolvedValue(product);

    // 模拟 merge 修改内存实体的行为
    repository.merge.mockImplementation(
      (entity: Product, changes: Partial<Product>) =>
        Object.assign(entity, changes),
    );

    // 模拟数据库保存后返回实体
    repository.save.mockImplementation(async (entity: Product) => entity);

    const result = await service.update(5, { stock: 0 });

    expect(repository.save).toHaveBeenCalledTimes(1);
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 5,
        name: '测试键盘',
        price: 99,
        stock: 0,
        status: 1,
      }),
    );
    expect(result.stock).toBe(0);
  });
});
