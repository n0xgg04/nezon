import 'reflect-metadata';
import { Injectable } from '@nestjs/common';
import { DiscoveryService, MetadataScanner, Reflector } from '@nestjs/core';
import { NEZON_COMMAND_METADATA } from '../decorators/command.decorator';
import {
  NEZON_EVENT_METADATA,
  NEZON_EVENT_ONCE_METADATA,
} from '../decorators/on.decorator';
import { NEZON_COMPONENT_METADATA } from '../decorators/component.decorator';
import { NezonCommandDefinition } from '../interfaces/command-definition.interface';
import { NezonEventDefinition } from '../interfaces/event-definition.interface';
import { NezonCommandOptions } from '../interfaces/command-options.interface';
import { NezonComponentDefinition } from '../interfaces/component-definition.interface';
import { NEZON_PARAMS_METADATA } from '../decorators/params.decorator';
import { NezonParameterMetadata } from '../interfaces/parameter-metadata.interface';
import { NEZON_RESTRICT_METADATA } from '../decorators/restrict.decorator';
import type { NezonRestrictConfig } from '../nezon.module-interface';

@Injectable()
export class NezonExplorerService {
  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly metadataScanner: MetadataScanner,
    private readonly reflector: Reflector,
  ) {}

  exploreCommands(): NezonCommandDefinition[] {
    const providers = this.discoveryService.getProviders();
    const commands: NezonCommandDefinition[] = [];
    for (const wrapper of providers) {
      const { instance } = wrapper;
      if (!instance || !Object.getPrototypeOf(instance)) {
        continue;
      }
      const prototype = Object.getPrototypeOf(instance);
      this.metadataScanner.scanFromPrototype(
        instance,
        prototype,
        (methodName) => {
          const methodRef = prototype[methodName];
          if (!methodRef) {
            return;
          }
          const options = this.reflector.get<NezonCommandOptions>(
            NEZON_COMMAND_METADATA,
            methodRef,
          );
          if (!options) {
            return;
          }
          const classRestrict =
            this.reflector.get<NezonRestrictConfig | undefined>(
              NEZON_RESTRICT_METADATA,
              instance.constructor,
            ) ?? undefined;
          const methodRestrict =
            this.reflector.get<NezonRestrictConfig | undefined>(
              NEZON_RESTRICT_METADATA,
              methodRef,
            ) ?? undefined;
          const restricts = this.mergeRestricts(classRestrict, methodRestrict);
          const parameters =
            Reflect.getMetadata(NEZON_PARAMS_METADATA, prototype, methodName) ??
            [];
          const sortedParameters = [...parameters].sort(
            (left: NezonParameterMetadata, right: NezonParameterMetadata) =>
              left.index - right.index,
          );
          commands.push({
            instance,
            methodName,
            options,
            parameters: sortedParameters,
            restricts,
          });
        },
      );
    }
    return commands;
  }

  exploreEvents(): NezonEventDefinition[] {
    const providers = this.discoveryService.getProviders();
    const listeners: NezonEventDefinition[] = [];
    for (const wrapper of providers) {
      const { instance } = wrapper;
      if (!instance || !Object.getPrototypeOf(instance)) {
        continue;
      }
      const prototype = Object.getPrototypeOf(instance);
      this.metadataScanner.scanFromPrototype(
        instance,
        prototype,
        (methodName) => {
          const methodRef = prototype[methodName];
          if (!methodRef) {
            return;
          }
          const event = this.reflector.get<string>(
            NEZON_EVENT_METADATA,
            methodRef,
          );
          if (!event) {
            return;
          }
          const once = !!this.reflector.get<boolean>(
            NEZON_EVENT_ONCE_METADATA,
            methodRef,
          );
          const classRestrict =
            this.reflector.get<NezonRestrictConfig | undefined>(
              NEZON_RESTRICT_METADATA,
              instance.constructor,
            ) ?? undefined;
          const methodRestrict =
            this.reflector.get<NezonRestrictConfig | undefined>(
              NEZON_RESTRICT_METADATA,
              methodRef,
            ) ?? undefined;
          const restricts = this.mergeRestricts(classRestrict, methodRestrict);
          const parameters =
            Reflect.getMetadata(NEZON_PARAMS_METADATA, prototype, methodName) ??
            [];
          const sortedParameters = [...parameters].sort(
            (left: NezonParameterMetadata, right: NezonParameterMetadata) =>
              left.index - right.index,
          );
          listeners.push({
            instance,
            methodName,
            event,
            once,
            parameters: sortedParameters,
            restricts,
          });
        },
      );
    }
    return listeners;
  }

  private mergeRestricts(
    base?: NezonRestrictConfig,
    override?: NezonRestrictConfig,
  ): NezonRestrictConfig | undefined {
    if (!base && !override) {
      return undefined;
    }
    const clans = [...(base?.clans ?? []), ...(override?.clans ?? [])];
    const channels = [...(base?.channels ?? []), ...(override?.channels ?? [])];
    const users = [...(base?.users ?? []), ...(override?.users ?? [])];
    const result: NezonRestrictConfig = {};
    if (clans.length) {
      result.clans = Array.from(new Set(clans));
    }
    if (channels.length) {
      result.channels = Array.from(new Set(channels));
    }
    if (users.length) {
      result.users = Array.from(new Set(users));
    }
    if (
      !result.clans?.length &&
      !result.channels?.length &&
      !result.users?.length
    ) {
      return undefined;
    }
    return result;
  }

  exploreComponents(): NezonComponentDefinition[] {
    const providers = this.discoveryService.getProviders();
    const components: NezonComponentDefinition[] = [];
    for (const wrapper of providers) {
      const { instance } = wrapper;
      if (!instance || !Object.getPrototypeOf(instance)) {
        continue;
      }
      const prototype = Object.getPrototypeOf(instance);
      this.metadataScanner.scanFromPrototype(
        instance,
        prototype,
        (methodName) => {
          const methodRef = prototype[methodName];
          if (!methodRef) {
            return;
          }
          const options =
            this.reflector.get(NEZON_COMPONENT_METADATA, methodRef) ?? null;
          if (!options) {
            return;
          }
          const classRestrict =
            this.reflector.get<NezonRestrictConfig | undefined>(
              NEZON_RESTRICT_METADATA,
              instance.constructor,
            ) ?? undefined;
          const methodRestrict =
            this.reflector.get<NezonRestrictConfig | undefined>(
              NEZON_RESTRICT_METADATA,
              methodRef,
            ) ?? undefined;
          const restricts = this.mergeRestricts(classRestrict, methodRestrict);
          const parameters =
            Reflect.getMetadata(NEZON_PARAMS_METADATA, prototype, methodName) ??
            [];
          const sortedParameters = [...parameters].sort(
            (left: NezonParameterMetadata, right: NezonParameterMetadata) =>
              left.index - right.index,
          );
          components.push({
            instance,
            methodName,
            options,
            parameters: sortedParameters,
            restricts,
          });
        },
      );
    }
    return components;
  }
}
