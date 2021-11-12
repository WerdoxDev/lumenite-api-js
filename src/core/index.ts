import { BaseDevice, BaseDeviceClass } from "../classes";
import { stringJson } from "../util";
import { LoginCredentials, Gateway, ResultCode, UpdateDevicePayload, User } from "./gateway";

export class Client {
  private _devices: Array<BaseDeviceClass> = [];
  public options: GatewayOptions;
  public connectedModules?: number;
  public connectedClients?: number;
  public totalModules?: number;
  public gateway: Gateway;
  public user?: User;

  constructor(options: GatewayOptions) {
    this.options = options;
  }

  async login(loginCredentials: LoginCredentials): Promise<ResultCode> {
    this.gateway = new Gateway(this);
    const result = await this.gateway.connect(loginCredentials, this.options);
    return result;
  }

  disconnect(): void {
    this.gateway.disconnect();
    this.devices.splice(0, this.devices.length);
    this.user = undefined;
    this.connectedClients = undefined;
    this.connectedModules = undefined;
    this.totalModules = undefined;
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

export * from "../util";
export * from "../classes";
export * from "./gateway";
