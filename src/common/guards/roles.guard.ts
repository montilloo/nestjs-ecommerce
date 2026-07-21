import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 读取接口要求的角色
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    // 没有设置角色要求，任何用户都可以访问
    if (!requiredRoles) {
      return true;
    }
    // 获取request对象
    const request = context.switchToHttp().getRequest();

    // 当前登录用户
    const user = request.user;

    if (!user) {
      return false;
    }

    console.log('当前用户：', user);

    return requiredRoles.includes(user.role);
  }
}
