import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Exclude, Expose } from 'class-transformer';

import { Account } from './account.entity';
import { Version } from './version.entity';

type VersionsInfo = {
  count: number;
  recentVersions: Partial<Version>[];
};

const NAME_LIMIT = 1000;
const DESC_LIMIT = 10_000;
const VERSIONS_LIMIT = 10;

@Entity({ name: 'services' })
export class Service extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @OneToMany(() => Version, (version) => version.service, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  @Expose()
  versions: Version[];

  @ManyToOne(() => Account, (Account) => Account.id, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    nullable: false,
  })
  @Index()
  @JoinColumn({ name: 'account_id' })
  @Exclude()
  account: Account;

  @Column({ length: NAME_LIMIT })
  name: string;

  @Column({ length: DESC_LIMIT, nullable: true })
  description: string;

  @CreateDateColumn()
  created_at: Date;

  @Index()
  @UpdateDateColumn()
  updated_at: Date;

  @Expose({ name: 'versions', groups: ['listing'] })
  get versions_info(): VersionsInfo {
    let versions = this.versions || [];
    versions = versions.sort((a, b) =>
      a.updated_at > b.updated_at ? -1 : b.updated_at > a.updated_at ? 1 : 0,
    );

    return {
      count: versions.length,
      recentVersions: versions.slice(0, VERSIONS_LIMIT),
    };
  }
}
