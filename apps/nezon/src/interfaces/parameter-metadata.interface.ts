export enum NezonParamType {
  CONTEXT = 'context',
  MESSAGE = 'message',
  CLIENT = 'client',
  ARGS = 'args',
  ARG = 'arg',
  ATTACHMENTS = 'attachments',
  MENTIONS = 'mentions',
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
  EVENT_PAYLOAD = 'event_payload',
  NEZON_UTILS = 'nezon_utils',
  FORM_DATA = 'form_data',
}

export interface NezonParameterMetadata {
  index: number;
  type: NezonParamType;
  data?: any;
}
