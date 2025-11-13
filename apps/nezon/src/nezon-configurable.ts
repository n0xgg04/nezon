import { ConfigurableModuleBuilder } from "@nestjs/common";
import { NezonModuleOptions } from "./nezon.module-interface";

export const {
	ConfigurableModuleClass,
	MODULE_OPTIONS_TOKEN: NEZON_MODULE_OPTIONS,
	OPTIONS_TYPE,
	ASYNC_OPTIONS_TYPE
} = new ConfigurableModuleBuilder<NezonModuleOptions>()
	.setClassMethodName('forRoot')
	.setFactoryMethodName('createNezonOptions')
	.build();