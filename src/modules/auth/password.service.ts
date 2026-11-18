import { Injectable } from '@nestjs/common';
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

export class PasswordService {
  private derive(password: string, salt: Buffer): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      scrypt(
        password,
        salt,
        64,
        {
          N: 32768, // CPU/memory cost parameter，必须是 2 的幂次方。
          r: 8, // 内存块大小参数。
          p: 3, // 并行化参数。
          maxmem: 64 * 1024 * 1024, // 最大内存使用量，单位为字节。
        },
        (err, derivedKey) => {
          if (err) {
            reject(err);
          }
          resolve(derivedKey);
        },
      );
    });
  }

  async hash(password: string): Promise<string> {
    const salt = randomBytes(16); // 生成一个 16 字节的随机盐值。
    const derivedKey = await this.derive(password, salt); // 使用 scrypt 算法派生密钥。
    return `scrypt-v1$${salt.toString('hex')}$${derivedKey.toString('hex')}`; // 返回盐值和派生密钥的十六进制表示，使用 $ 分隔。格式：scrypt-v1$随机盐$哈希结果。scrypt-v1 标记本次算法参数方案，未来调整参数时可以新增版本，保留旧密码的验证能力。
  }

  async verify(password: string, hashedPassword: string): Promise<boolean> {
    const match = hashedPassword.match(
      /^scrypt-v1\$([0-9a-f]{32})\$([0-9a-f]{128})$/,
    );

    if (!match) {
      return false;
    }
    const salt = Buffer.from(match[1], 'hex');
    const expectedKey = Buffer.from(match[2], 'hex');
    const actualKey = await this.derive(password, salt);

    return timingSafeEqual(actualKey, expectedKey);
  }
}
