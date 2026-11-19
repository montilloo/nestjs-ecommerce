import { IsString, Length, Matches } from 'class-validator';

export class LoginDto {
  @IsString()
  @Matches(/^[a-zA-Z0-9_]{3,50}$/, {
    message: '用户名需为3到50个字符，且只能包含字母、数字和下划线',
  })
  username!: string;

  @IsString()
  @Length(1, 128)
  password!: string;
}
