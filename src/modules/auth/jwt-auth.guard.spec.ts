import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let jwtService: JwtService;
  let guard: JwtAuthGuard;
  let context: ExecutionContext;

  let request: {
    headers: { authorization?: string };
    user?: { sub: number; role: string };
  };

  beforeEach(() => {
    jwtService = new JwtService({
      // 仅用于测试，不使用实际环境的密钥
      secret: 'test-only-secret-for-jwt-guard-tests',
      signOptions: {
        algorithm: 'HS256',
        expiresIn: 900,
      },
      verifyOptions: {
        algorithms: ['HS256'],
      },
    });

    guard = new JwtAuthGuard(jwtService);
    request = { headers: {} };

    // Guard 只使用这部分上下文，所以仅模拟这些方法
    context = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  });

  it('缺少令牌时拒绝请求', async () => {
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    expect(request.user).toBeUndefined();
  });

  it('签名密钥不匹配时拒绝请求', async () => {
    const token = await jwtService.signAsync(
      { sub: 5, role: 'admin' },
      { secret: 'another-test-secret' },
    );

    request.headers.authorization = `Bearer ${token}`;

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    expect(request.user).toBeUndefined();
  });

  it('令牌过期时拒绝请求', async () => {
    const token = await jwtService.signAsync(
      { sub: 5, role: 'admin' },
      { expiresIn: -1 },
    );

    request.headers.authorization = `Bearer ${token}`;

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    expect(request.user).toBeUndefined();
  });

  it('合法令牌通过，并设置用户身份', async () => {
    const token = await jwtService.signAsync({
      sub: 5,
      role: 'admin',
    });

    request.headers.authorization = `Bearer ${token}`;

    await expect(guard.canActivate(context)).resolves.toBe(true);

    expect(request.user).toEqual({
      sub: 5,
      role: 'admin',
    });
  });
});
