import { BaseDevice, GatewayOptions } from "./types";
import { connect, getDevices } from "./gateway";
import { BaseDeviceClass, OutputDeviceClass } from "./classes";

var devices: Array<BaseDeviceClass> = [];

export async function login(options: GatewayOptions) {
  await connect(options);
  devices = getDevices();
}

export function getDeviceById<T extends BaseDeviceClass>(id: number): T {
  var device = devices.find((x) => x.id === id) || devices[0];
  return device as T;
}
