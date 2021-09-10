//#region Device types
export interface Device {
  readonly id: number;
  name: string;
  status?: DeviceStatus;
  readonly type: DeviceType;
}

export interface BaseDevice extends Device {
  config: DeviceConfiguration;
}

export interface InputDevice extends BaseDevice {}

export interface OutputDevice extends BaseDevice {
  settings: OutputSettings;
}
//#endregion

//#region Device properties
export interface DeviceConfiguration {
  pinConfig: PinConfiguration;
  moduleToken: string;
  validCommands: Array<number>;
}

export interface PinConfiguration {
  pin: number;
  pinCheck?: number;
}

export interface Status {
  power: number;
}

export interface DeviceStatus {
  futureStatus: Status;
  currentStatus: Status;
  lastStatus: Status;
}

export interface OutputSettings {
  automaticTimings: AutomaticTimings;
  timeoutTime: number;
}

//#endregion

//#region Automatic related
export interface AutomaticTiming {
  id: number;
  name: string;
  dates: Array<AutomaticDate>;
  weekdays: Array<AutomaticWeekday>;
  // TODO: Add the actual time here later
}

export interface AutomaticDate {
  year: number;
  month: number;
  date: number;
}

export interface AutomaticWeekday {
  day: number;
}

export type AutomaticTimings = Array<AutomaticTiming>;
//#endregion

//#region Payload types
export interface ChangeDeviceStatusPayload {
  id: number;
  type: DeviceType;
  status: DeviceStatus;
}

export interface ClientInitializePayload {
  devices: Array<BaseDevice>;
  config: ClientConfiguration;
}

export interface ModuleDeviceSettingsPayload {
  id: number;
  type: DeviceType;
  settings: OutputSettings;
}

export interface ModuleDeviceStatusPayload {
  id: number;
  type: DeviceType;
  status: {
    currentStatus: number;
  };
}

export type ClientSetConnectedPayload = Array<number>;

export type ClientSetDevicesPayload = Array<SetDevicesPayload>;

export interface SetDevicesPayload {
  id: number;
  status: DeviceStatus;
}

//#endregion

//#region Other
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

export interface Command {
  id: number;
  deviceId: number;
  payload: Array<string>;
}

//#endregion

//#region Enums

export enum DeviceType {
  None = "NONE",
  OutputDevice = "OUTPUT_DEVICE",
  InputDevice = "INPUT_DEVICE",
  RgbLight = "RGB_LIGHT",
  TemperatureSensor = "TEMPERATURE_SENSOR",
}

export enum StatusType {
  Offline = -2,
  Processing = -1,
  Off = 0,
  On = 1,
}

export enum CommandType {
  Power = 0,
  PowerChanged = 1,
}
//#endregion
