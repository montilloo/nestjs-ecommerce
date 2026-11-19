import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { UserService } from '../user/user.service';
import { PasswordService } from './password.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto): Promise<{ accessToken: string }> {
    const user = await this.userService.findForLogin(dto.username);

    // 用户不存在和密码错误，统一返回相同的 401 提示。
    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }
    // verify() 的第一个参数是输入的明文密码，第二个是数据库哈希。
    const isPasswordValid = await this.passwordService.verify(
      dto.password,
      user.passwordHash,
    );

    // 用户不存在和密码错误，统一返回相同的 401 提示。
    if (!isPasswordValid) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      role: user.role,
    });
    // JWT 中的身份和角色来自数据库；响应只返回令牌，不返回含有密码哈希的用户实体。
    return { accessToken };
  }
}
