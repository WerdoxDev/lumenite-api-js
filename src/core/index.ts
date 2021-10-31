import { BaseDevice, BaseDeviceClass } from "../classes";
import { stringJson } from "../util";
import { Gateway, GatewayStatus, UpdateDevicePayload } from "./gateway";

export class Client {
  private _devices: Array<BaseDeviceClass> = [];
  public options: GatewayOptions;
  public connectedModules: number;
  public connectedClients: number;
  public totalModules: number;
  private _config: ClientConfiguration;
  public gateway: Gateway;

  constructor(options: GatewayOptions) {
    this.options = options;
  }

  async login(): Promise<GatewayStatus> {
    this.gateway = new Gateway(this);
    const result = await this.gateway.connect(this.options);
    return result;
  }

  set devices(value: Array<BaseDeviceClass>) {
    this.devices.splice(0, this.devices.length);
    value.forEach((x) => {
      this.devices.push(x);
    });
  }

  get devices(): Array<BaseDeviceClass> {
    return this._devices;
  }

  set config(value: ClientConfiguration) {
    this._config = value;
    this.totalModules = this._config.registeredModuleTokens.length;
  }

  get config(): ClientConfiguration {
    return this._config;
  }

  deviceById<T extends BaseDeviceClass>(id: number): T {
    const device = this.devices.find((x) => x.id === id) || this.devices[0];
    return device as T;
  }

  addDevice(device: BaseDevice): void {
    this.gateway.mqttClient.publish(
      `client/${this.gateway.id}/update-device`,
      stringJson({ operation: "add", deviceOrId: device } as UpdateDevicePayload)
    );
  }

  updateDevice(device: BaseDevice): void {
    this.gateway.mqttClient.publish(
      `client/${this.gateway.id}/update-device`,
      stringJson({ operation: "update", deviceOrId: device } as UpdateDevicePayload)
    );
  }

  removeDevice(id: number): void {
    this.gateway.mqttClient.publish(
      `client/${this.gateway.id}/update-device`,
      stringJson({ operation: "delete", deviceOrId: id } as UpdateDevicePayload)
    );
  }
}

export interface GatewayOptions {
  url: string;
  port?: number;
  username?: string;
  password?: string;
  protocol: Protocol;
}

export type Protocol = "ws" | "wss" | "mqtt" | "mqtts";

export interface ClientConfiguration {
  registeredModuleTokens: Array<string>;
}

export * from "../util";
export * from "../classes";
export * from "./gateway";
