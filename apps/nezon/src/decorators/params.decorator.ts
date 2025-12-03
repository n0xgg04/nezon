import 'reflect-metadata';
import { Inject } from '@nestjs/common';
import { MezonClient as MezonClientClass } from 'mezon-sdk';
import type { ChannelMessage } from 'mezon-sdk';
import type { TextChannel } from 'mezon-sdk/dist/cjs/mezon-client/structures/TextChannel';
import type { User as MezonUser } from 'mezon-sdk/dist/cjs/mezon-client/structures/User';
import {
  NezonParamType,
  NezonParameterMetadata,
} from '../interfaces/parameter-metadata.interface';

export const NEZON_PARAMS_METADATA = 'nezon:params';

/**
 * Stores metadata about a parameter decorator so the runtime injector can resolve the value.
 *
 * @param metadata Parameter metadata without the parameter index.
 */
function setParamMetadata(metadata: Omit<NezonParameterMetadata, 'index'>) {
  return (
    target: object,
    propertyKey: string | symbol,
    parameterIndex: number,
  ) => {
    const existing: NezonParameterMetadata[] =
      Reflect.getMetadata(NEZON_PARAMS_METADATA, target, propertyKey) ?? [];
    existing.push({
      ...metadata,
      index: parameterIndex,
    });
    Reflect.defineMetadata(
      NEZON_PARAMS_METADATA,
      existing,
      target,
      propertyKey,
    );
  };
}

export function Context(): ParameterDecorator {
  /**
   * Injects the raw command/component context object.
   */
  return setParamMetadata({
    type: NezonParamType.CONTEXT,
  });
}

export function ChannelMessagePayload<K extends keyof ChannelMessage = never>(
  key?: K,
): ParameterDecorator {
  /**
   * Injects the low-level `ChannelMessage` payload emitted by Mezon.
   *
   * @param key Optional key to extract a specific property from the ChannelMessage object.
   * If provided, returns the value of that property instead of the entire object.
   *
   * @example
   * ```ts
   * @Command('test')
   * async handler(
   *   @ChannelMessagePayload() message: Nezon.ChannelMessage,
   *   @ChannelMessagePayload('message_id') messageId: string | undefined,
   * ) {}
   * ```
   */
  return setParamMetadata({
    type: NezonParamType.MESSAGE,
    data: key,
  });
}

export function Client(): ParameterDecorator {
  return (
    target: object,
    propertyKey: string | symbol | undefined,
    parameterIndex: number,
  ) => {
    setParamMetadata({
      type: NezonParamType.CLIENT,
    })(target, propertyKey, parameterIndex);
    Inject(MezonClientClass)(target, propertyKey, parameterIndex);
  };
}

export function MezonClient(): ParameterDecorator {
  return (
    target: object,
    propertyKey: string | symbol | undefined,
    parameterIndex: number,
  ) => {
    setParamMetadata({
      type: NezonParamType.CLIENT,
    })(target, propertyKey, parameterIndex);
    Inject(MezonClientClass)(target, propertyKey, parameterIndex);
  };
}

export function Args(): ParameterDecorator {
  /**
   * Injects the parsed array of text arguments (already stripped of prefix and command name).
   */
  return setParamMetadata({
    type: NezonParamType.ARGS,
  });
}

export function Arg(position = 0): ParameterDecorator {
  /**
   * Injects a single argument by index from the parsed argument list.
   *
   * @param position Zero-based index of the argument.
   */
  return setParamMetadata({
    type: NezonParamType.ARG,
    data: position,
  });
}

export function Attachments(position?: number): ParameterDecorator {
  return setParamMetadata({
    type: NezonParamType.ATTACHMENTS,
    data: typeof position === 'number' ? position : undefined,
  });
}

export function Mentions(position?: number): ParameterDecorator {
  return setParamMetadata({
    type: NezonParamType.MENTIONS,
    data: typeof position === 'number' ? position : undefined,
  });
}

export function ComponentPayload(): ParameterDecorator {
  /**
   * Injects the raw component payload (e.g. `MessageButtonClicked`).
   */
  return setParamMetadata({
    type: NezonParamType.COMPONENT,
  });
}

export function ComponentParams(paramName?: string): ParameterDecorator {
  /**
   * Injects parameters derived from the component identifier.
   *
   * @param paramName Optional parameter name to get a specific named parameter.
   * If provided, returns the value of that named parameter.
   * If omitted, returns an object with all named parameters, or array if no named params.
   *
   * @example
   * ```ts
   * @Component({ pattern: '/user/:user_id/:action' })
   * async handler(
   *   @ComponentParams() allParams: Record<string, string> | string[],
   *   @ComponentParams('user_id') userId: string,
   * ) {}
   * ```
   */
  return setParamMetadata({
    type: NezonParamType.COMPONENT_PARAMS,
    data: paramName,
  });
}

export function ComponentParam(
  positionOrName: number | string = 0,
): ParameterDecorator {
  /**
   * Injects a specific parameter derived from the component identifier.
   *
   * @param positionOrName Zero-based index in the component params array, or parameter name for named parameters.
   *
   * @example
   * ```ts
   * @Component({ pattern: '/user/:user_id/:action' })
   * async handler(
   *   @ComponentParam('user_id') userId: string,
   *   @ComponentParam(0) firstParam: string,
   * ) {}
   * ```
   */
  return setParamMetadata({
    type: NezonParamType.COMPONENT_PARAM,
    data: positionOrName,
  });
}

export function MessageContent(): ParameterDecorator {
  /**
   * Injects the text content (`content.t`) of the current message.
   */
  return setParamMetadata({
    type: NezonParamType.MESSAGE_CONTENT,
  });
}

export function Channel<K extends keyof TextChannel = never>(
  key?: K,
): ParameterDecorator {
  /**
   * Injects the resolved channel entity associated with the message or component.
   * The value is cached per execution to avoid duplicate fetches.
   *
   * @param key Optional key to extract a specific property from the Channel object.
   * If provided, returns the value of that property instead of the entire object.
   *
   * @example
   * ```ts
   * @Command('test')
   * async handler(
   *   @Channel() channel: Nezon.Channel | undefined,
   *   @Channel('id') channelId: string | undefined,
   * ) {}
   * ```
   */
  return setParamMetadata({
    type: NezonParamType.CHANNEL,
    data: key,
  });
}

export function Clan(): ParameterDecorator {
  /**
   * Injects the clan entity associated with the message or component (if any).
   * The value is cached per execution to avoid duplicate fetches.
   */
  return setParamMetadata({
    type: NezonParamType.CLAN,
  });
}

export function User<K extends keyof MezonUser = never>(
  key?: K,
): ParameterDecorator {
  /**
   * Injects the user entity who triggered the message or component.
   * The value is cached per execution to avoid duplicate fetches.
   *
   * @param key Optional key to extract a specific property from the User object.
   * If provided, returns the value of that property instead of the entire object.
   *
   * @example
   * ```ts
   * @Command('test')
   * async handler(
   *   @User() user: Nezon.User | undefined,
   *   @User('username') username: string | undefined,
   *   @User('id') userId: string | undefined,
   * ) {}
   * ```
   */
  return setParamMetadata({
    type: NezonParamType.USER,
    data: key,
  });
}

export function Message(): ParameterDecorator {
  /**
   * Injects the fetched `Message` entity for the current message or component target.
   * The value is lazily fetched and cached per execution.
   */
  return setParamMetadata({
    type: NezonParamType.THIS_MESSAGE,
  });
}

export function ComponentTarget(): ParameterDecorator {
  /**
   * Injects the `Message` entity associated with the component interaction target.
   * Falls back to fetching the message if it is not already cached.
   */
  return setParamMetadata({
    type: NezonParamType.COMPONENT_TARGET,
  });
}

/**
 * Injects an auto-generated helper tuple similar to Necord's `@Context()`.
 * Resolves to `[ManagedMessage, DMHelper, ChannelHelper]`, enabling convenience helpers.
 *
 * **Cách 1: Lấy toàn bộ tuple (backward compatible)**
 * ```ts
 * @Command('ping')
 * async onPing(@AutoContext() [message]: Nezon.AutoContext) {
 *   await message.reply(Nezon.SmartMessage.text('pong'));
 * }
 * ```
 *
 * **Cách 2: Lấy phần tử cụ thể bằng key**
 * ```ts
 * @Command('dm')
 * async onDM(
 *   @AutoContext('message') message: Nezon.AutoContextType.Message,
 *   @AutoContext('dm') dm: Nezon.AutoContextType.DM,
 * ) {
 *   await dm.send(userId, SmartMessage.text('Hello!'));
 * }
 * ```
 *
 * Available keys:
 * - `'message'` - Returns `ManagedMessage` (type: `Nezon.AutoContextType.Message`)
 * - `'dm'` - Returns `DMHelper` (type: `Nezon.AutoContextType.DM`)
 * - `'channel'` - Returns `ChannelHelper` (type: `Nezon.AutoContextType.Channel`)
 *
 * Combine với `Nezon.SmartMessage` để dựng payload gửi tin nhắn một cách an toàn.
 */
export function AutoContext(
  key?: 'message' | 'dm' | 'channel',
): ParameterDecorator {
  return setParamMetadata({
    type: NezonParamType.AUTO_CONTEXT,
    data: key,
  });
}

/**
 * Injects the event payload from @On or @Once handlers.
 * The payload type depends on the event being listened to.
 *
 * @example
 * ```ts
 * @On(Events.TokenSend)
 * async onTokenSend(@EventPayload() payload: Nezon.TokenSendPayload) {
 *   console.log('Token sent:', payload);
 * }
 * ```
 *
 * @example
 * ```ts
 * @On(Events.AddClanUser)
 * async onAddClanUser(@EventPayload() payload: Nezon.AddClanUserPayload) {
 *   console.log('User added:', payload.user_id);
 * }
 * ```
 */
export function EventPayload(): ParameterDecorator {
  return setParamMetadata({
    type: NezonParamType.EVENT_PAYLOAD,
  });
}

export function NezonUtils(): ParameterDecorator {
  return setParamMetadata({
    type: NezonParamType.NEZON_UTILS,
  });
}

export function FormData(field?: string): ParameterDecorator {
  /**
   * Injects parsed form inputs submitted alongside the component action.
   *
   * @param field Optional key to retrieve a specific input value.
   * If omitted, returns the entire form data record.
   *
   * @example
   * ```ts
   * @Component('lixi/submit')
   * async onSubmit(
   *   @FormData() form: Nezon.FormData | undefined,
   *   @FormData('lixi-title') title: string | undefined,
   * ) {}
   * ```
   */
  return setParamMetadata({
    type: NezonParamType.FORM_DATA,
    data: field,
  });
}
