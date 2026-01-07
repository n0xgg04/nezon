import { Inject, Injectable, Logger } from '@nestjs/common';
import { MezonClient } from 'mezon-sdk';
import { NEZON_MODULE_OPTIONS } from '../nezon-configurable';
import { NezonModuleOptions } from '../nezon.module-interface';
import { setClientService } from './get-mezon-client';

@Injectable()
export class NezonClientService {
  private readonly logger = new Logger(NezonClientService.name);
  private client: MezonClient | null = null;
  private isLoggedIn = false;
  private isRetrying = false;
  private readyHandler: (() => void) | null = null;

  constructor(
    @Inject(NEZON_MODULE_OPTIONS)
    private readonly options: NezonModuleOptions,
  ) {
    setClientService(this);
  }

  getClient(): MezonClient {
    if (!this.client) {
      this.client = new MezonClient(this.options);
      this.setupEventListeners();
    }
    return this.client;
  }

  private setupEventListeners() {
    if (!this.client) {
      return;
    }

    const clientAny = this.client as any;

    if (this.readyHandler) {
      this.client.removeListener('ready', this.readyHandler);
    }
    this.readyHandler = () => {
      this.logger.log('✅ MezonClient login thành công');
    };
    this.client.on('ready', this.readyHandler);

    const socketManager = clientAny.socketManager;
    if (socketManager) {
      const originalOndisconnect = socketManager.ondisconnect?.bind(socketManager);
      if (originalOndisconnect) {
        socketManager.ondisconnect = (e: any) => {
          originalOndisconnect(e);
          if (!socketManager.isHardDisconnect) {
            this.logger.warn('⚠️ MezonClient bị disconnect, đang retry login...');
            this.isLoggedIn = false;
            this.handleAutoRetry();
          }
        };
      }

      const originalOnerror = socketManager.onerror?.bind(socketManager);
      if (originalOnerror) {
        socketManager.onerror = async (evt: any) => {
          await originalOnerror(evt);
          if (!socketManager.isHardDisconnect) {
            this.logger.error('❌ MezonClient gặp lỗi, đang retry login...');
            this.isLoggedIn = false;
            this.handleAutoRetry();
          }
        };
      }
    }
  }

  private async handleAutoRetry() {
    const { autoRetry = false } = this.options;
    if (!autoRetry || this.isRetrying) {
      return;
    }

    this.isRetrying = true;
    try {
      await this.login();
    } catch (error) {
      this.logger.error('❌ Retry login thất bại:', error);
    } finally {
      this.isRetrying = false;
    }
  }

  async login() {
    if (this.isLoggedIn) {
      return;
    }

    const {
      autoRetry = false,
      maxRetry,
      retryDuration,
      onCrash,
    } = this.options;

    if (!autoRetry) {
      try {
        const client = this.getClient();
        await client.login();
        this.isLoggedIn = true;
        this.logger.log('✅ MezonClient login thành công');
      } catch (error) {
        if (onCrash) {
          await onCrash(
            error instanceof Error ? error : new Error(String(error)),
          );
        } else {
          throw error;
        }
      }
      return;
    }

    const startTime = Date.now();
    const retryDurationMs = retryDuration
      ? retryDuration * 60 * 60 * 1000
      : undefined;
    let attempt = 0;
    let lastError: Error | null = null;

    while (true) {
      try {
        const client = this.getClient();
        await client.login();
        this.isLoggedIn = true;
        this.logger.log('✅ MezonClient login thành công');
        return;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        attempt++;
        this.logger.warn(
          `⚠️ Login thất bại (lần thử ${attempt}): ${lastError.message}`,
        );

        if (maxRetry !== undefined && attempt > maxRetry) {
          this.logger.error(
            `❌ Đã đạt max retry (${maxRetry}), dừng retry`,
          );
          throw lastError;
        }

        if (retryDurationMs) {
          const elapsed = Date.now() - startTime;
          if (elapsed >= retryDurationMs) {
            this.logger.error(
              `❌ Đã vượt quá retry duration (${retryDuration} giờ), dừng retry`,
            );
            throw lastError;
          }
        }

        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 60000);
        this.logger.log(`⏳ Đợi ${delay}ms trước khi retry...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  async disconnect() {
    if (!this.client) {
      return;
    }

    if (this.readyHandler) {
      this.client.removeListener('ready', this.readyHandler);
      this.readyHandler = null;
    }

    this.client.closeSocket();
    this.client.removeAllListeners();
    this.client = null;
    this.isLoggedIn = false;
    this.isRetrying = false;
  }
}
