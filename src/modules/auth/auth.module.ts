import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard } from './jwt-auth.guard';

import { UserModule } from '../user/user.module';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        // 服务端用于签名和验签的密钥。
        const secret = config.getOrThrow<string>('JWT_SECRET');

        if (!secret.trim()) {
          throw new Error('JWT_SECRET 不能为空');
        }

        return {
          secret,
          signOptions: {
            algorithm: 'HS256',
            expiresIn: 900, // 令牌有效期为 900 秒，即 15 分钟。
          },
          verifyOptions: {
            algorithms: ['HS256'],
          },
        };
      },
    }),
    UserModule,
  ],
  providers: [JwtAuthGuard],
  exports: [JwtModule, JwtAuthGuard], // exports: [JwtModule]：后续导入 AuthModule 的模块可以注入 JwtService。
})
export class AuthModule {}
