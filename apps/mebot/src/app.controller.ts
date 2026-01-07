import { Controller, Get, Param } from '@nestjs/common';
import {
  Client,
  EmbedBuilder,
  getMezonClient,
  SmartMessage,
} from '@n0xgg04/nezon';
import type { MezonClient } from 'mezon-sdk';
import { AppService } from './app.service';
import { getDMUtils } from './utils/get-dm-utils';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @Client() private readonly client: MezonClient,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('client-info')
  async getClientInfo() {
    return {
      message: 'MezonClient is available',
      hasClient: !!this.client,
      hasGlobalClient: !!getMezonClient(),
    };
  }

  @Get('client-constructor')
  async getClientFromConstructor(@Client() client: MezonClient) {
    return {
      message: 'MezonClient injected via @Client() decorator',
      hasClient: !!client,
      sameInstance: client === this.client,
    };
  }

  @Get('send/:user_id')
  async sendDM(@Param('user_id') userId: string) {
    try {
      const mezon = getMezonClient();
      const dm = getDMUtils(mezon as unknown as MezonClient);

      const message = SmartMessage.build().addEmbed(
        new EmbedBuilder()
          .setColor('#FF9800')
          .setTitle('LOA LOA LOA, nhắc nhở trực nhật chút nè!')
          .setDescription(
            'LOA LOA LOA, nhắc nhở trực nhật chút nè!\n\nAnh/chị/em nhớ hoàn thành nhiệm vụ trực nhật nhé!\n\nĐừng quên Check lại tủ lạnh, nckd, lò vi sóng cuối giờ',
          )
          .setImage('https://media.tenor.com/cb9L14uH-YAAAAAM/cool-fun.gif')
          .setFooter('HN3 Office'),
      );

      await dm.send(userId, message);

      return {
        success: true,
        message: `Đã gửi DM đến user ${userId}`,
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }
}
