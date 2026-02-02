import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = Number(process.env.PORT ?? 0);
  try {
    await app.listen(port);
  } catch (error) {
    if ((error as any)?.code === 'EADDRINUSE') {
      await app.listen(0);
      return;
    }
    throw error;
  }
}
bootstrap();
