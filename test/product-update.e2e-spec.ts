import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { ProductController } from '../src/modules/product/product.controller';
import { ProductService } from '../src/modules/product/product.service';
import { JwtModule, JwtService } from '@nestjs/jwt';

describe('商品更新接口', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let accessToken: string | undefined;
  const service = {
    update: jest.fn(),
  };
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          secret: 'test-only-secret-for-product-update',
          signOptions: {
            algorithm: 'HS256',
            expiresIn: 900,
          },
          verifyOptions: {
            algorithms: ['HS256'],
          },
        }),
      ],
      controllers: [ProductController],
      providers: [{ provide: ProductService, useValue: service }],
    }).compile();
    jwtService = moduleRef.get(JwtService);
    app = moduleRef.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();
  });

  beforeEach(async () => {
    service.update.mockReset();
    accessToken = await jwtService.signAsync({ sub: 5, role: 'admin' });
  });

  afterAll(async () => {
    await app.close();
  });

  function patchProduct(path: string) {
    const req = request(app.getHttpServer()).patch(path);

    if (accessToken !== undefined) {
      req.set('Authorization', `Bearer ${accessToken}`);
    }

    return req;
  }

  it('接收库存 0，并将数字 ID 交给 Service', async () => {
    service.update.mockResolvedValue({
      id: 5,
      name: '测试商品',
      stock: 0,
    });

    await patchProduct('/products/5').send({ stock: 0 }).expect(200);

    expect(service.update).toHaveBeenCalledWith(
      5,
      expect.objectContaining({ stock: 0 }),
    );
  });

  it.each([{ stock: null }, { stock: -1 }, { stock: 1.5 }, { id: 99 }])(
    '拒绝非法请求体 %j',
    async (body) => {
      await patchProduct('/products/5').send(body).expect(400);

      expect(service.update).not.toHaveBeenCalled();
    },
  );

  it('拒绝非整数路径参数', async () => {
    await patchProduct('/products/abc').send({ stock: 0 }).expect(400);

    expect(service.update).not.toHaveBeenCalled();
  });

  it('没有令牌时返回 401，不调用更新服务', async () => {
    accessToken = undefined;

    await patchProduct('/products/5').send({ stock: 0 }).expect(401);

    expect(service.update).not.toHaveBeenCalled();
  });

  it('普通用户令牌返回 403，不调用更新服务', async () => {
    accessToken = await jwtService.signAsync({
      sub: 6,
      role: 'user',
    });

    await patchProduct('/products/5').send({ stock: 0 }).expect(403);

    expect(service.update).not.toHaveBeenCalled();
  });
});
