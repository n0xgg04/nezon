export enum NezonParamType {
  CONTEXT = 'context',
  MESSAGE = 'message',
  CLIENT = 'client',
  ARGS = 'args',
  ARG = 'arg',
  COMPONENT = 'component',
  COMPONENT_PARAMS = 'component_params',
  COMPONENT_PARAM = 'component_param',
  MESSAGE_CONTENT = 'message_content',
  CHANNEL = 'channel',
  CLAN = 'clan',
  USER = 'user',
  THIS_MESSAGE = 'this_message',
  COMPONENT_TARGET = 'component_target',
  AUTO_CONTEXT = 'auto_context',
}

export interface NezonParameterMetadata {
  index: number;
  type: NezonParamType;
  data?: any;
}

