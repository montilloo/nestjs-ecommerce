import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export default registerAs('database', (): TypeOrmModuleOptions => ({
  type: 'mysql' as const,
  host: process.env.DB_HOST!,
  port: Number(process.env.DB_PORT ?? 3306),
  username: process.env.DB_USERNAME!,
  password: process.env.DB_PASSWORD!,
  database: process.env.DB_DATABASE!,
  // synchronize如果为true，启动项目的时候，TypeORM 会自动修改数据库结构。开发阶段很方便。生产环境却非常危险。
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV === 'development',
  autoLoadEntities: true,
}));
