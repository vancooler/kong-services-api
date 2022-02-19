import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Expose } from 'class-transformer';

import { Service } from './service.entity';

const NAME_LIMIT = 1000;
const DESC_LIMIT = 10_000;

@Entity({ name: 'versions' })
@Index(['service', 'name'], { unique: true })
export class Version extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @ManyToOne(() => Service, (service) => service.versions, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    nullable: false,
  })
  @Index()
  @JoinColumn({ name: 'service_id' })
  service: Service;

  @Column({ length: NAME_LIMIT })
  name: string;

  @Expose({ groups: ['full'] })
  @Column({ length: DESC_LIMIT, nullable: true })
  description: string;

  @CreateDateColumn()
  created_at: Date;

  @Index()
  @UpdateDateColumn()
  updated_at: Date;
}
