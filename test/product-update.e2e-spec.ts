import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { ProductController } from '../src/modules/product/product.controller';
import { ProductService } from '../src/modules/product/product.service';

describe('商品更新接口', () => {
  let app: INestApplication;
  let currentUser: { role: string } | undefined;
  const service = {
    update: jest.fn(),
  };
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ProductController],
      providers: [{ provide: ProductService, useValue: service }],
    }).compile();

    app = moduleRef.createNestApplication();

    // 仅存在于测试应用，不加入 main.ts
    app.use((req, _res, next) => {
      // req.user = { role: 'admin' };
      // 将测试应用中的身份注入改为读取currentUser变量：
      req.user = currentUser;
      next();
    });

    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();
  });

  beforeEach(() => {
    service.update.mockReset();
    currentUser = { role: 'admin' };
  });

  afterAll(async () => {
    await app.close();
  });

  it('接收库存 0，并将数字 ID 交给 Service', async () => {
    service.update.mockResolvedValue({
      id: 5,
      name: '测试商品',
      stock: 0,
    });

    await request(app.getHttpServer())
      .patch('/products/5')
      .send({ stock: 0 })
      .expect(200);

    expect(service.update).toHaveBeenCalledWith(
      5,
      expect.objectContaining({ stock: 0 }),
    );
  });

  it.each([{ stock: null }, { stock: -1 }, { stock: 1.5 }, { id: 99 }])(
    '拒绝非法请求体 %j',
    async (body) => {
      await request(app.getHttpServer())
        .patch('/products/5')
        .send(body)
        .expect(400);

      expect(service.update).not.toHaveBeenCalled();
    },
  );

  it('拒绝非整数路径参数', async () => {
    await request(app.getHttpServer())
      .patch('/products/abc')
      .send({ stock: 0 })
      .expect(400);

    expect(service.update).not.toHaveBeenCalled();
  });

  it('没有用户身份时返回 403，不调用更新服务', async () => {
    currentUser = undefined;

    await request(app.getHttpServer())
      .patch('/products/5')
      .send({ stock: 0 })
      .expect(403);

    expect(service.update).not.toHaveBeenCalled();
  });

  it('普通用户返回 403，不调用更新服务', async () => {
    currentUser = { role: 'user' };

    await request(app.getHttpServer())
      .patch('/products/5')
      .send({ stock: 0 })
      .expect(403);

    expect(service.update).not.toHaveBeenCalled();
  });
});
