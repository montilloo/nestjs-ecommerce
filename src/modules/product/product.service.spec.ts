import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { ProductService } from './product.service';
import { Product } from './entities/product.entity';

describe('ProductService.update', () => {
  let service: ProductService;

  const manager = {
    findOne: jest.fn(),
    merge: jest.fn(),
    save: jest.fn(),
  };

  const repository = {
    manager: {
      transaction: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    repository.manager.transaction.mockImplementation(
      async (_isolationLevel, callback) => callback(manager),
    );

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
    // repository.findOneBy.mockResolvedValue(null);

    // await expect(service.update(999, { stock: 0 })).rejects.toBeInstanceOf(
    //   NotFoundException,
    // );

    // expect(repository.findOneBy).toHaveBeenCalledWith({ id: 999 });
    // expect(repository.merge).not.toHaveBeenCalled();
    // expect(repository.save).not.toHaveBeenCalled();
    manager.findOne.mockResolvedValue(null);

    await expect(
      service.update(999, { name: '新名称' }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(manager.save).not.toHaveBeenCalled();
  });

  it('只更新名称时保留读取到的库存', async () => {
    const product = Object.assign(new Product(), {
      id: 5,
      name: '旧名称',
      price: 99,
      stock: 4,
      status: 1,
    });

    manager.findOne.mockResolvedValue(product);

    manager.merge.mockImplementation(
      (_target, entity: Product, changes: Partial<Product>) =>
        Object.assign(entity, changes),
    );

    manager.save.mockImplementation(async (_target, entity: Product) => entity);

    const result = await service.update(5, { name: '新名称' });

    expect(manager.save).toHaveBeenCalledWith(
      Product,
      expect.objectContaining({
        name: '新名称',
        price: 99,
        stock: 4,
      }),
    );

    expect(result.stock).toBe(4);
  });
});
