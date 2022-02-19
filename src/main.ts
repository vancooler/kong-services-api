import { NestFactory, Reflector } from '@nestjs/core';
import { ClassSerializerInterceptor } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const service = await NestFactory.create(AppModule, { logger: console });
  service.useGlobalInterceptors(
    new ClassSerializerInterceptor(service.get(Reflector)),
  );

  await service.listen(3000);
}
bootstrap();
