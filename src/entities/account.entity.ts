import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Service } from './service.entity';
import { User } from './user.entity';

const NAME_LIMIT = 1000;

@Entity({ name: 'accounts' })
export class Account extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @OneToMany(() => User, (User) => User.account, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  users: User[];

  @OneToMany(() => Service, (Service) => Service.account, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  services: Service[];

  @Column({ length: NAME_LIMIT })
  name: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
