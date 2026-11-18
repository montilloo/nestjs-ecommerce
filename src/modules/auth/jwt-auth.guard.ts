/**
 * 这段代码分三步：
1. 从 Authorization: Bearer <token> 中提取令牌。
2. verifyAsync() 校验签名和有效期；失败时返回 401。JWT 官方接口说明
3. 检查用户信息结构，通过后写入 request.user。
 */
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { Observable } from 'rxjs';

interface JwtUser {
  sub: number;
  role: 'admin' | 'user';
}

type AuthenticatedRequest = Request & { user?: JwtUser };

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;
    const match = authorization?.match(/^Bearer ([^\s]+)$/i);

    if (!match) {
      throw new UnauthorizedException('缺少或无效的 Authorization 头');
    }

    let payload: JwtUser;
    // 这里我们约定令牌中的用户信息为：
    /**
     * 
     * {
          sub: 5,        // 用户 ID，本项目先约定为正整数
          role: 'admin', // 用户角色
        }
     */
    try {
      payload = await this.jwtService.verifyAsync<JwtUser>(match[1]);
    } catch (err) {
      throw new UnauthorizedException('访问令牌已过期或无效的 JWT 令牌');
    }

    if (
      !payload ||
      !Number.isSafeInteger(payload.sub) ||
      payload.sub <= 0 ||
      !['admin', 'user'].includes(payload.role)
    ) {
      throw new UnauthorizedException('访问令牌中的用户信息无效');
    }

    request.user = {
      sub: payload.sub,
      role: payload.role,
    };
    return true;
  }
}
