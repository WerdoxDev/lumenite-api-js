import { BaseDevice, GatewayOptions } from "./types";
import { BaseDeviceClass, OutputDeviceClass } from "./classes";
import { Gateway } from "./gateway";

export class Client {
  private readonly _devices: Array<BaseDeviceClass> = [];
  public readonly options: GatewayOptions;
  private gateway: Gateway;

  constructor(options: GatewayOptions) {
    this.options = options;
  }

  async login() {
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

  get devices() {
    return this._devices;
  }

  deviceById<T extends BaseDeviceClass>(id: number): T {
    var device = this.devices.find((x) => x.id === id) || this.devices[0];
    return device as T;
  }
}
