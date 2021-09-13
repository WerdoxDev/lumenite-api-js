import { Gateway, GatewayStatus } from "./gateway";
import { BaseDeviceClass } from "./classes";

export class Client {
  public _devices: Array<BaseDeviceClass> = [];
  public options: GatewayOptions;
  public connectedModules: number;
  public connectedClients: number;
  public totalModules: number;
  private _config: ClientConfiguration;
  private gateway: Gateway;

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
}

export interface GatewayOptions {
  url: string;
  port?: number;
  username?: string;
  password?: string;
  protocol: "ws" | "wss" | "mqtt" | "mqtts";
}

export interface ClientConfiguration {
  registeredModuleTokens: Array<string>;
}

export * from "./util";
export * from "./classes";
export * from "./gateway";
