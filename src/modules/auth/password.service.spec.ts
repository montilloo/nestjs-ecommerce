import { PasswordService } from './password.service';

describe('PasswordService', () => {
  const service = new PasswordService();
  const password = 'test-only-password-123';

  it('正确密码验证通过', async () => {
    const hash = await service.hash(password);

    await expect(service.verify(password, hash)).resolves.toBe(true);
  });

  it('错误密码验证失败', async () => {
    const hash = await service.hash(password);

    await expect(service.verify('wrong-password', hash)).resolves.toBe(false);
  });

  it('相同密码每次生成不同结果，且均能验证', async () => {
    const first = await service.hash(password);
    const second = await service.hash(password);

    expect(first).not.toBe(second);
    await expect(service.verify(password, first)).resolves.toBe(true);
    await expect(service.verify(password, second)).resolves.toBe(true);
  });

  it('存储格式错误时返回 false', async () => {
    await expect(service.verify(password, 'invalid-hash')).resolves.toBe(false);
  });
});
