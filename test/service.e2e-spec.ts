import * as request from 'supertest';
import { Connection, getConnection, getManager } from 'typeorm';
import { INestApplication, ExecutionContext } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppModule } from '../src/app.module';
import { Account } from '../src/entities/account.entity';
import { classToPlain } from 'class-transformer';
import { JwtAuthGuard } from '../src/modules/auth/jwt-auth.guard';
import { Service } from '../src/entities/service.entity';
import { ServiceController } from '../src/modules/service/service.controller';
import { ServiceService } from '../src/modules/service/service.service';
import { User } from '../src/entities/user.entity';
import { Version } from '../src/entities/version.entity';

describe('ServiceController (e2e)', () => {
  let app: INestApplication;
  let manager;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          req.user = { id: 'abc123', email: 'aa@aa.com' };
          return true;
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    manager = getManager();
  });

  beforeEach(async () => {
    await manager
      .getRepository(Account)
      .createQueryBuilder()
      .delete()
      .from(Account)
      .execute();
  });

  describe('/services (GET) ', () => {
    it('sorting', async () => {
      await manager.insert(Account, { name: 'Account 1' });
      const account = await manager.findOne(Account, { name: 'Account 1' });

      await manager.insert(User, {
        email: 'aa@aa.com',
        password: 'pass',
        name: 'name',
        account: account,
      });

      await manager.insert(Service, {
        name: 'Service 1',
        description: 'this is a description',
        account: account,
      });
      await manager.insert(Service, {
        name: 'Service 2',
        description: 'this is a description',
        account: account,
      });

      const serviceOne = await manager.findOne(Service, { name: 'Service 1' });
      const serviceTwo = await manager.findOne(Service, { name: 'Service 2' });

      const expected = {
        data: [
          classToPlain(serviceTwo, { groups: ['listing'] }),
          classToPlain(serviceOne, { groups: ['listing'] }),
        ],
        total: 2,
        page: 1,
        page_size: 12,
        last_page: 1,
      };

      return request(app.getHttpServer())
        .get('/services')
        .expect(200)
        .expect(expected);
    });

    describe('pagination', () => {
      let account: Account;
      let services: Partial<Service>[];
      const serviceKeys = Array.from(Array(20).keys());

      beforeEach(async () => {
        await manager.insert(Account, { name: 'Account 1' });
        account = await manager.findOne(Account, { name: 'Account 1' });
        await manager.insert(User, {
          email: 'aa@aa.com',
          password: 'pass',
          name: 'name',
          account: account,
        });

        for (let key of serviceKeys) {
          await manager.insert(Service, {
            name: `Service ${key + 1}`,
            description: 'this is a description',
            account: account,
          });
        }

        services = await Promise.all(
          serviceKeys.map(async (key) => {
            return await manager.findOne(Service, {
              name: `Service ${key + 1}`,
            });
          }),
        );
      });

      it('without any pagination input', async () => {
        const expected = {
          data: services
            .map((service) => classToPlain(service, { groups: ['listing'] }))
            .reverse()
            .slice(0, 12),
          total: 20,
          page: 1,
          page_size: 12,
          last_page: 2,
        };

        return request(app.getHttpServer())
          .get('/services')
          .expect(200)
          .expect(expected);
      });

      it('without page and default page size', async () => {
        const expected = {
          data: services
            .map((service) => classToPlain(service, { groups: ['listing'] }))
            .reverse()
            .slice(12, 20),
          total: 20,
          page: 2,
          page_size: 12,
          last_page: 2,
        };

        return request(app.getHttpServer())
          .get('/services?page=2')
          .expect(200)
          .expect(expected);
      });

      it('with page and page_size input', async () => {
        const expected = {
          data: services
            .map((service) => classToPlain(service, { groups: ['listing'] }))
            .reverse()
            .slice(6, 12),
          total: 20,
          page: 2,
          page_size: 6,
          last_page: 4,
        };

        return request(app.getHttpServer())
          .get('/services?page=2&page_size=6')
          .expect(200)
          .expect(expected);
      });
    });

    it('searching', async () => {
      await manager.insert(Account, { name: 'Account 1' });
      const account = await manager.findOne(Account, { name: 'Account 1' });
      await manager.insert(User, {
        email: 'aa@aa.com',
        password: 'pass',
        name: 'name',
        account: account,
      });

      await manager.insert(Service, {
        name: 'Service 1',
        description: 'A service that satisfies search',
        account: account,
      });
      await manager.insert(Service, {
        name: 'Service 2',
        description: 'A service that satisfies search for service 1',
        account: account,
      });
      await manager.insert(Service, {
        name: 'Service 3',
        description:
          'A service that satisfies search for service 3 instead of 1',
        account: account,
      });
      await manager.insert(Service, {
        name: 'Service 41',
        description: 'A service that does not satisfies search',
        account: account,
      });

      const serviceOne = await manager.findOne(Service, { name: 'Service 1' });
      const serviceTwo = await manager.findOne(Service, { name: 'Service 2' });

      const expected = {
        data: [
          classToPlain(serviceTwo, { groups: ['listing'] }),
          classToPlain(serviceOne, { groups: ['listing'] }),
        ],
        total: 2,
        page: 1,
        page_size: 12,
        last_page: 1,
      };

      return request(app.getHttpServer())
        .get('/services?search=service 1')
        .expect(200)
        .expect(expected);
    });

    it('only lists services in the account of login user', async () => {
      await manager.insert(Account, { name: 'Account 1' });
      const account = await manager.findOne(Account, { name: 'Account 1' });
      await manager.insert(Account, { name: 'AnotherAccount' });
      const anotherAccount = await manager.findOne(Account, {
        name: 'AnotherAccount',
      });

      await manager.insert(User, {
        email: 'aa@aa.com',
        password: 'pass',
        name: 'name',
        account: account,
      });

      await manager.insert(Service, {
        name: 'Service 1',
        account: anotherAccount,
      });
      await manager.insert(Service, {
        name: 'Service 2',
        account: anotherAccount,
      });
      await manager.insert(Service, {
        name: 'Service 3',
        account: account,
      });

      const service = await manager.findOne(Service, { name: 'Service 3' });

      const expected = {
        data: [classToPlain(service, { groups: ['listing'] })],
        total: 1,
        page: 1,
        page_size: 12,
        last_page: 1,
      };

      return request(app.getHttpServer())
        .get('/services')
        .expect(200)
        .expect(expected);
    });
  });

  describe('/services/:id (GET) ', () => {
    it('responses service of given id', async () => {
      await manager.insert(Account, { name: 'Account 1' });
      const account = await manager.findOne(Account, { name: 'Account 1' });

      await manager.insert(User, {
        email: 'aa@aa.com',
        password: 'pass',
        name: 'name',
        account: account,
      });

      await manager.insert(Service, {
        name: 'Service 1',
        account: account,
      });

      let service = await manager.findOne(
        Service,
        { name: 'Service 1' },
        { relations: ['versions'] },
      );

      await manager.insert(Version, {
        name: 'Version 1',
        service: service,
      });

      service = await manager.findOne(
        Service,
        { name: 'Service 1' },
        { relations: ['versions'] },
      );

      const expected = classToPlain(service, { groups: ['full'] });

      return request(app.getHttpServer())
        .get(`/services/${service.id}`)
        .expect(200)
        .expect(expected);
    });

    it('returns 404 if service cannot be found in account of login user', async () => {
      await manager.insert(Account, { name: 'Account 1' });
      const account = await manager.findOne(Account, { name: 'Account 1' });
      await manager.insert(Account, { name: 'AnotherAccount' });
      const anotherAccount = await manager.findOne(Account, {
        name: 'AnotherAccount',
      });

      await manager.insert(User, {
        email: 'aa@aa.com',
        password: 'pass',
        name: 'name',
        account: account,
      });

      await manager.insert(Service, {
        name: 'Service 1',
        account: anotherAccount,
      });

      const service = await manager.findOne(Service, { name: 'Service 1' });

      return request(app.getHttpServer())
        .get(`/services/${service.id}`)
        .expect(404);
    });
  });
});
