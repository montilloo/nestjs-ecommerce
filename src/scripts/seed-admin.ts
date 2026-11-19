import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';

import { AppModule } from '../app.module';
import { PasswordService } from '../modules/auth/password.service';
import { User } from '../modules/user/entities/user.entity';

async function bootstrap() {
  if ((process.env.NODE_ENV ?? 'development') !== 'development') {
    throw new Error('此脚本仅供本地开发使用');
  }

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });

  try {
    const config = app.get(ConfigService);
    const username = config.getOrThrow<string>('SEED_USERNAME').trim();
    const password = config.getOrThrow<string>('SEED_PASSWORD');

    if (!/^[a-zA-Z0-9_]{3,50}$/.test(username)) {
      throw new Error('用户名需为3到50位字母、数字或下划线');
    }

    if (password.length < 12 || password.length > 128) {
      throw new Error('测试密码长度需为12到128个字符');
    }

    const dataSource = app.get(DataSource);

    // 避免开发环境 SQL 日志输出密码哈希
    dataSource.setOptions({ logging: false });

    const repository = dataSource.getRepository(User);
    const existing = await repository.findOneBy({ username });

    if (existing) {
      console.log('账号已存在，跳过创建，不修改密码和角色');
      return;
    }

    const passwordService = app.get(PasswordService);
    const passwordHash = await passwordService.hash(password);

    const user = repository.create({
      username,
      passwordHash,
      role: 'admin',
    });

    await repository.save(user);

    console.log('本地管理员测试账号创建成功');
  } finally {
    await app.close();
  }
}

bootstrap().catch(() => {
  console.error('初始化失败，请检查本地账号配置和数据库连接');
  process.exitCode = 1;
});
