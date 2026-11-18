import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type UserRole = 'admin' | 'user';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 50, unique: true })
  username!: string; // username 唯一，避免同一个用户名对应多个账号。

  @Column({ length: 255, select: false })
  passwordHash!: string; // 密码的哈希值，使用 select: false 避免在查询时返回密码哈希。

  @Column({
    type: 'enum',
    enum: ['admin', 'user'],
    default: 'user',
  })
  role!: UserRole; // 角色默认是普通用户，不能由登录请求指定管理员身份。

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
