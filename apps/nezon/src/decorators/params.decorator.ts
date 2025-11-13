import 'reflect-metadata';
import { NezonParamType, NezonParameterMetadata } from '../interfaces/parameter-metadata.interface';

export const NEZON_PARAMS_METADATA = 'nezon:params';

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
  return setParamMetadata({
    type: NezonParamType.CONTEXT,
  });
}

export function ChannelMessagePayload(): ParameterDecorator {
  return setParamMetadata({
    type: NezonParamType.MESSAGE,
  });
}

export function Client(): ParameterDecorator {
  return setParamMetadata({
    type: NezonParamType.CLIENT,
  });
}

export function Args(): ParameterDecorator {
  return setParamMetadata({
    type: NezonParamType.ARGS,
  });
}

export function Arg(position = 0): ParameterDecorator {
  return setParamMetadata({
    type: NezonParamType.ARG,
    data: position,
  });
}

export function ComponentPayload(): ParameterDecorator {
  return setParamMetadata({
    type: NezonParamType.COMPONENT,
  });
}

export function ComponentParams(): ParameterDecorator {
  return setParamMetadata({
    type: NezonParamType.COMPONENT_PARAMS,
  });
}

export function ComponentParam(position = 0): ParameterDecorator {
  return setParamMetadata({
    type: NezonParamType.COMPONENT_PARAM,
    data: position,
  });
}

export function MessageContent(): ParameterDecorator {
  return setParamMetadata({
    type: NezonParamType.MESSAGE_CONTENT,
  });
}

export function Channel(): ParameterDecorator {
  return setParamMetadata({
    type: NezonParamType.CHANNEL,
  });
}

export function Clan(): ParameterDecorator {
  return setParamMetadata({
    type: NezonParamType.CLAN,
  });
}

export function NezonUser(): ParameterDecorator {
  return setParamMetadata({
    type: NezonParamType.USER,
  });
}

export function NezonMessage(): ParameterDecorator {
  return setParamMetadata({
    type: NezonParamType.THIS_MESSAGE,
  });
}

export function ComponentTarget(): ParameterDecorator {
  return setParamMetadata({
    type: NezonParamType.COMPONENT_TARGET,
  });
}

