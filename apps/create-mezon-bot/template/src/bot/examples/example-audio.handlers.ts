import { Injectable } from '@nestjs/common';
import {
  Args,
  AutoContext,
  Channel,
  ChannelMessagePayload,
  Client,
  Command,
  NezonUtils,
  SmartMessage,
} from '@n0xgg04/nezon';
import type { Nezon } from '@n0xgg04/nezon';

@Injectable()
export class ExampleAudioHandlers {
  @Command('voice')
  async onVoice(
    @Args() args: Nezon.Args,
    @AutoContext() [managedMessage]: Nezon.AutoContext,
    @NezonUtils() utils?: Nezon.NezonUtilsService,
  ) {
    const audioUrl =
      args[0] ||
      'https://cdn.mezon.vn/audio/3dd3cf73e7c34330b54dec42d6d20777.wav';
    const transcript = args[1] || 'Đây là một tin nhắn âm thanh mẫu';

    const loadingMessage = SmartMessage.system('Đang tải...');
    const loadingAck = await managedMessage.reply(loadingMessage);

    if (!loadingAck?.message_id || !loadingAck?.channel_id) {
      return;
    }

    const messageId = loadingAck.message_id;
    const channelId = loadingAck.channel_id;
    const utilsService = utils;

    setTimeout(async () => {
      try {
        if (!utilsService) {
          console.error('❌ NezonUtilsService không khả dụng');
          return;
        }

        const voiceMessage = SmartMessage.voice(audioUrl, {
          transcript: transcript,
        });
        const payload = voiceMessage.toJSON();
        console.log('Voice message payload:', JSON.stringify(payload, null, 2));

        const managedMsg = await utilsService.getManagedMessage(
          messageId,
          channelId,
        );
        if (managedMsg) {
          await managedMsg.update(voiceMessage);
        }
      } catch (error) {
        console.error('❌ Lỗi khi update voice message:', error);
      }
    }, 3000);
  }

  @Command('audio')
  async onAudio(
    @Args() args: Nezon.Args,
    @AutoContext() [managedMessage]: Nezon.AutoContext,
  ) {
    const audioUrl =
      args[0] ||
      'https://cdn.mezon.vn/audio/3dd3cf73e7c34330b54dec42d6d20777.wav';

    if (!audioUrl) {
      await managedMessage.reply(
        SmartMessage.text(
          'Sử dụng: *audio <url>\n\nVí dụ: *audio https://example.com/audio.mp3',
        ),
      );
      return;
    }

    await managedMessage.reply(
      SmartMessage.voice(audioUrl, {
        transcript: '🎵 Tin nhắn âm thanh',
      }),
    );
  }

  @Command('voice-with-text')
  async onVoiceWithText(@AutoContext() [managedMessage]: Nezon.AutoContext) {
    const audioUrl =
      'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
    const filename = audioUrl.split('/').pop() || 'audio.mp3';

    await managedMessage.reply(
      SmartMessage.text(
        '🎤 Đây là transcript của tin nhắn voice. Người dùng có thể đọc transcript này nếu không thể nghe audio.',
      ).addFile(audioUrl, filename, 'audio/mpeg'),
    );
  }

  @Command('multiple-audio')
  async onMultipleAudio(@AutoContext() [managedMessage]: Nezon.AutoContext) {
    await managedMessage.reply(
      SmartMessage.text('🎵 Nhiều tin nhắn âm thanh')
        .addFile(
          'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
          'song1.mp3',
          'audio/mpeg',
        )
        .addFile(
          'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
          'song2.mp3',
          'audio/mpeg',
        ),
    );
  }

  @Command('test-audio')
  async onTestAudio(@AutoContext() [managedMessage]: Nezon.AutoContext) {
    await managedMessage.reply(
      SmartMessage.text('🎵 Test audio với filetype: audio').addFile(
        'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        'test.mp3',
        'audio',
      ),
    );
  }

  @Command('zip')
  async onZip(
    @Args() args: Nezon.Args,
    @AutoContext() [managedMessage]: Nezon.AutoContext,
  ) {
    const zipUrl =
      args[0] ||
      'https://github.com/octocat/Hello-World/archive/refs/heads/master.zip';

    if (!zipUrl) {
      await managedMessage.reply(
        SmartMessage.text(
          'Sử dụng: *zip <url>\n\nVí dụ: *zip https://example.com/archive.zip',
        ),
      );
      return;
    }

    const filename = zipUrl.split('/').pop() || 'archive.zip';

    const message = SmartMessage.text('📦 File ZIP đính kèm').addFile(
      zipUrl,
      filename,
      'application/x-zip-compressed',
      { size: 0 },
    );

    const payload = message.toJSON();
    console.log('ZIP message payload:', JSON.stringify(payload, null, 2));

    await managedMessage.reply(message);
  }

  @Command('pdf')
  async onPdf(
    @Args() args: Nezon.Args,
    @AutoContext() [managedMessage]: Nezon.AutoContext,
  ) {
    const pdfUrl =
      args[0] ||
      'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';

    if (!pdfUrl) {
      await managedMessage.reply(
        SmartMessage.text(
          'Sử dụng: *pdf <url>\n\nVí dụ: *pdf https://example.com/document.pdf',
        ),
      );
      return;
    }

    const filename = pdfUrl.split('/').pop() || 'document.pdf';

    const message = SmartMessage.text('📄 File PDF đính kèm').addFile(
      pdfUrl,
      filename,
      'application/pdf',
      { size: 0 },
    );

    const payload = message.toJSON();
    console.log('PDF message payload:', JSON.stringify(payload, null, 2));

    await managedMessage.reply(message);
  }

  @Command('excel')
  async onExcel(
    @Args() args: Nezon.Args,
    @Channel() channel: Nezon.Channel | undefined,
    @ChannelMessagePayload() messagePayload: Nezon.ChannelMessage,
    @Client() client: Nezon.Client,
  ) {
    console.log('ê');
    const excelUrl =
      args[0] ||
      'https://file-examples.com/wp-content/storage/2017/02/file_example_XLSX_10.xlsx';
    const filename = excelUrl.split('/').pop() || 'spreadsheet.xlsx';
    const ext = filename.toLowerCase().split('.').pop() || 'xlsx';
    const mimeType =
      ext === 'xls'
        ? 'application/vnd.ms-excel'
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    const message = SmartMessage.text('📊 File Excel đính kèm').addFile(
      excelUrl,
      filename,
      mimeType,
      { size: 0 },
    );

    const payload = message.toJSON();
    console.log('Excel message payload:', JSON.stringify(payload, null, 2));

    let targetChannel = channel;
    if (!targetChannel && messagePayload.channel_id) {
      targetChannel = await client.channels.fetch(messagePayload.channel_id);
    }

    if (!targetChannel) {
      console.error('❌ Không thể fetch channel');
      return;
    }

    console.log('đây là channel id: ', targetChannel.id);

    await targetChannel.send(
      payload.content,
      payload.mentions && payload.mentions.length > 0
        ? payload.mentions
        : undefined,
      payload.attachments && payload.attachments.length > 0
        ? payload.attachments
        : undefined,
    );
  }
}
