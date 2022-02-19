import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { classToPlain } from 'class-transformer';
import { Repository } from 'typeorm';
import { Request } from 'express';

import { Service } from '../../entities/service.entity';
import { User } from '../../entities/user.entity';
import { Account } from '../../entities/account.entity';
import { Version } from '../../entities/version.entity';

@Injectable()
export class ServiceService {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
  ) {}

  async getList(req: Request, user: Partial<User>): Promise<object> {
    const servicesQueryBuilder = await this.servicesQueryBuilder(req, user);

    const page: number = parseInt(req.query.page as any) || 1;
    const pageSize: number = parseInt(req.query.page_size as any) || 12;

    const services = await servicesQueryBuilder
      .offset((page - 1) * pageSize)
      .limit(pageSize)
      .getMany();
    const serviceIds = services.map((service) => service.id);
    const total = serviceIds.length;

    const data = await this.servicesByIds(serviceIds);
    return {
      data: data.map((service) =>
        classToPlain(service, { groups: ['listing'] }),
      ),
      total,
      page,
      page_size: pageSize,
      last_page: Math.ceil(total / pageSize),
    };
  }

  async getById(id: string, user: Partial<User>): Promise<Partial<Service>> {
    const service = await this.serviceRepository.findOne({
      where: { id: id, account: user.account.id },
      relations: ['versions'],
    });

    if (service === undefined) {
      throw new NotFoundException();
    }

    service.versions = service.versions.sort((a, b) =>
      a.updated_at > b.updated_at ? -1 : b.updated_at > a.updated_at ? 1 : 0,
    );

    return classToPlain(service, { groups: ['full'] });
  }

  private async servicesQueryBuilder(req: Request, user: Partial<User>) {
    const builder = await this.serviceRepository.createQueryBuilder('services');
    const search = req.query.search;
    builder.where({ account: user.account.id });

    if (search) {
      builder.where(
        'LOWER(services.name) LIKE :s OR LOWER(services.description) LIKE :s',
        {
          s: `%${search}%`.toLowerCase(),
        },
      );
    }

    builder
      .orderBy('services.updated_at', 'DESC')
      .addOrderBy('services.id', 'ASC');

    return builder;
  }

  private async servicesByIds(ids: string[]) {
    return await this.serviceRepository
      .createQueryBuilder('services')
      .where('services.id IN (:...ids)', { ids: ids })
      .orderBy('services.updated_at', 'DESC')
      .addOrderBy('services.id', 'ASC')
      .leftJoinAndSelect('services.versions', 'versions')
      .getMany();
  }
}
