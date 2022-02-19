import { Controller, Get, Req, Param, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { getConnection } from 'typeorm';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Service } from '../../entities/service.entity';
import { User } from '../../entities/user.entity';
import { ServiceService } from './service.service';

@Controller('services')
@UseGuards(JwtAuthGuard)
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}

  @Get()
  async getList(@Req() req: Request): Promise<object> {
    console.log(await this.currentUser(req));
    return await this.serviceService.getList(req, await this.currentUser(req));
  }

  @Get(':id')
  async getById(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<Partial<Service>> {
    return await this.serviceService.getById(id, await this.currentUser(req));
  }

  private async currentUser(@Req() req: Request): Promise<User> {
    const user: Partial<User> = req.user;
    const connection = getConnection();

    return await connection.getRepository(User).findOne({
      where: { email: user.email },
      relations: ['account'],
    });
  }
}
