import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Service } from '../../entities/service.entity';
import { ServiceController } from './service.controller';
import { ServiceService } from './service.service';
import { typeOrmConfig } from '../../configs/typeorm.config';

@Module({
  imports: [TypeOrmModule.forFeature([Service])],
  controllers: [ServiceController],
  providers: [ServiceService],
})
export class ServiceModule {}
