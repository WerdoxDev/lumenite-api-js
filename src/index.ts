import { BaseDeviceClass } from "./classes";
import { Gateway } from "./gateway";

export class Client {
  private readonly _devices: Array<BaseDeviceClass> = [];
  public readonly options: GatewayOptions;
  private gateway: Gateway;

  constructor(options: GatewayOptions) {
    this.options = options;
  }

  async login(): Promise<void> {
    this.gateway = new Gateway(this);
    await this.gateway.connect();

    console.log(this.devices.length);
  }

  set devices(value: Array<BaseDeviceClass>) {
    this.devices.splice(0, this.devices.length);
    console.log(value.length + " V");
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
}

export interface GatewayOptions {
  url: string;
  port: number;
  username: string;
  password: string;
  protocol: "ws" | "wss" | "mqtt" | "mqtts";
}

export interface ClientConfiguration {
  registeredModuleTokens: Array<string>;
}
