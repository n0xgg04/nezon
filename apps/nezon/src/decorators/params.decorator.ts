import 'reflect-metadata';
import { NezonParamType, NezonParameterMetadata } from '../interfaces/parameter-metadata.interface';

export const NEZON_PARAMS_METADATA = 'nezon:params';

/**
 * Stores metadata about a parameter decorator so the runtime injector can resolve the value.
 *
 * @param metadata Parameter metadata without the parameter index.
 */
function setParamMetadata(
  metadata: Omit<NezonParameterMetadata, 'index'>,
) {
  return (target: object, propertyKey: string | symbol, parameterIndex: number) => {
    const existing: NezonParameterMetadata[] =
      Reflect.getMetadata(NEZON_PARAMS_METADATA, target, propertyKey) ?? [];
    existing.push({
      ...metadata,
      index: parameterIndex,
    });
    Reflect.defineMetadata(NEZON_PARAMS_METADATA, existing, target, propertyKey);
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

export function ChannelMessagePayload(): ParameterDecorator {
  /**
   * Injects the low-level `ChannelMessage` payload emitted by Mezon.
   */
  return setParamMetadata({
    type: NezonParamType.MESSAGE,
  });
}

export function Client(): ParameterDecorator {
  /**
   * Injects the shared `MezonClient` instance.
   */
  return setParamMetadata({
    type: NezonParamType.CLIENT,
  });
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

export function ComponentPayload(): ParameterDecorator {
  /**
   * Injects the raw component payload (e.g. `MessageButtonClicked`).
   */
  return setParamMetadata({
    type: NezonParamType.COMPONENT,
  });
}

export function ComponentParams(): ParameterDecorator {
  /**
   * Injects the array of parameters derived from the component identifier.
   */
  return setParamMetadata({
    type: NezonParamType.COMPONENT_PARAMS,
  });
}

export function ComponentParam(position = 0): ParameterDecorator {
  /**
   * Injects a specific parameter derived from the component identifier.
   *
   * @param position Zero-based index in the component params array.
   */
  return setParamMetadata({
    type: NezonParamType.COMPONENT_PARAM,
    data: position,
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

export function Channel(): ParameterDecorator {
  /**
   * Injects the resolved channel entity associated with the message or component.
   * The value is cached per execution to avoid duplicate fetches.
   */
  return setParamMetadata({
    type: NezonParamType.CHANNEL,
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

export function User(): ParameterDecorator {
  /**
   * Injects the user entity who triggered the message or component.
   * The value is cached per execution to avoid duplicate fetches.
   */
  return setParamMetadata({
    type: NezonParamType.USER,
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

