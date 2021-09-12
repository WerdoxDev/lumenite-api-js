import { Gateway } from "./gateway";
import { BaseDeviceClass } from "./classes";

export class Client {
  private readonly _devices: Array<BaseDeviceClass> = [];
  public readonly options: GatewayOptions;
  private _config: ClientConfiguration;
  private gateway: Gateway;

  constructor(options: GatewayOptions) {
    this.options = options;
  }

  async login(): Promise<void> {
    this.gateway = new Gateway(this);
    await this.gateway.connect();

    this._config = this.gateway.config;
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
