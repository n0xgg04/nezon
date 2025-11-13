import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ExampleHandlers } from './bot/example.handlers';
import { NezonModule } from '@n0xgg04/nezon';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    NezonModule.forRoot({
      token: process.env.MEZON_TOKEN ?? '',
      botId: process.env.MEZON_BOT_ID ?? '',
    }),
  ],
  controllers: [AppController],
  providers: [AppService, ExampleHandlers],
})
export class AppModule {}

