import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  TypeOrmModuleAsyncOptions,
  TypeOrmModuleOptions,
} from '@nestjs/typeorm';
import { Account } from '../entities/account.entity';
import { Service } from '../entities/service.entity';
import { User } from '../entities/user.entity';
import { Version } from '../entities/version.entity';
import 'dotenv/config';

export const typeOrmConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [Account, Service, User, Version],
  synchronize: process.env.DB_SYNC == 'true',
  logging: process.env.DB_LOG == 'true',
};
