import { stringJson, parseJson, emptyStatus, buildCommand } from "./util";

export class BaseDeviceClass implements BaseDevice {
  readonly id: number;
  config: BaseConfiguration;
  name: string;
  type: DeviceType;
  status?: DeviceStatus;

  constructor(
    id: number,
    name: string,
    type: DeviceType,
    status: DeviceStatus | undefined,
    config: BaseConfiguration,
    public mqttClient: import("mqtt").MqttClient
  ) {
    this.id = id;
    this.name = name;
    this.type = type;
    this.status = status;
    this.config = config;
  }

  setPower(power: StatusType): void {
    if (!this.isInValidState) return;
    this.futureStatus.power = power;
    const temp = this.currentStatus;
    Object.freeze(temp);
    this.currentStatus = { power: StatusType.Processing };
    this.lastStatus = temp;

    const command = buildCommand(CommandType.Power, this.id, [stringJson(this.futureStatus), stringJson(this.lastStatus)]);
    this.mqttClient.publish(`module/${this.config.moduleToken}/execute-command`, stringJson(command));
  }

  togglePower(): void {
    this.setPower(this.oppositePower(this.currentStatus));
  }

  executeCommonCommands(command: Command): boolean {
    let isExecuted = false;
    if (!this.config.validCommands.find((x) => x === command.id)) throw new Error("Command is not valid for device");

    if (command.id === CommandType.PowerChanged) {
      this.currentStatus = parseJson(command.payload[0]);
      isExecuted = true;
    }

    return isExecuted;
  }

  executeCommand(command: Command): void {
    this.executeCommonCommands(command);
  }

  get isInValidState(): boolean {
    const currentStatus = this.currentStatus;
    return currentStatus.power !== StatusType.Offline && currentStatus.power !== StatusType.Processing;
  }

  get futureStatus(): Status {
    if (this.status !== undefined) return this.status.futureStatus;
    else return emptyStatus(this.type);
  }

  set futureStatus(value: Status) {
    if (this.status !== undefined) {
      this.status.futureStatus = value;
    } else throw new Error("FutureStatus was null!");
  }

  get currentStatus(): Status {
    if (this.status !== undefined) return this.status.currentStatus;
    else return emptyStatus(this.type);
  }

  set currentStatus(value: Status) {
    if (this.status !== undefined) {
      this.status.currentStatus = value;
    } else throw new Error("CurrentStatus was null!");
  }

  get lastStatus(): Status {
    if (this.status !== undefined) return this.status.lastStatus;
    else return emptyStatus(this.type);
  }

  set lastStatus(value: Status) {
    if (this.status !== undefined) {
      this.status.lastStatus = value;
    } else throw new Error("LastStatus was null!");
  }

  // Only works with devices that have ON and OFF as status
  oppositePower(status: Status): StatusType {
    return status.power === StatusType.On ? StatusType.Off : StatusType.On;
  }
}

export class OutputDeviceClass extends BaseDeviceClass implements OutputDevice {
  settings: OutputSettings;

  constructor(
    id: number,
    name: string,
    type: DeviceType,
    status: DeviceStatus | undefined,
    config: BaseConfiguration,
    settings: OutputSettings,
    mqttClient: import("mqtt").MqttClient
  ) {
    super(id, name, type, status, config, mqttClient);
    this.settings = settings;
  }
}

export class RgbLightDeviceClass extends BaseDeviceClass implements RgbLightDevice {
  config: RgbLightConfiguration;
  status?: RgbLightDeviceStatus;

  constructor(
    id: number,
    name: string,
    type: DeviceType,
    status: RgbLightDeviceStatus | undefined,
    config: RgbLightConfiguration,
    mqttClient: import("mqtt").MqttClient
  ) {
    super(id, name, type, status, config, mqttClient);
    this.config = config;
    this.status = status;
  }

  setColor(redValue: number, greenValue: number, blueValue: number): void {
    const futureStatus = this.futureStatus as RgbLightStatus;
    futureStatus.power = this.currentStatus.power;
    futureStatus.redValue = redValue;
    futureStatus.greenValue = greenValue;
    futureStatus.blueValue = blueValue;

    const command = buildCommand(CommandType.Color, this.id, [stringJson(this.futureStatus), stringJson(this.lastStatus)]);
    this.mqttClient.publish(`module/${this.config.moduleToken}/execute-command`, stringJson(command));
  }

  executeCommand(command: Command): void {
    if (this.executeCommonCommands(command)) return;

    if (command.id === CommandType.ColorChanged) {
      (this.currentStatus as RgbLightStatus) = parseJson(command.payload[0]);
    }
  }
}

export class TempSensorDeviceClass extends BaseDeviceClass implements TempSensorDevice {
  config: TempSensorConfiguration;
  status?: TempSensorDeviceStatus;

  constructor(
    id: number,
    name: string,
    type: DeviceType,
    status: TempSensorDeviceStatus | undefined,
    config: TempSensorConfiguration,
    mqttClient: import("mqtt").MqttClient
  ) {
    super(id, name, type, status, config, mqttClient);
    this.config = config;
    this.status = status;
  }
}

export interface Device {
  readonly id: number;
  name: string;
  status?: DeviceStatus;
  readonly type: DeviceType;
}

export interface BaseDevice extends Device {
  config: BaseConfiguration;
}

// export interface InputDevice extends BaseDevice {}

export interface OutputDevice extends BaseDevice {
  settings: OutputSettings;
}

export interface RgbLightDevice extends BaseDevice {
  config: RgbLightConfiguration;
  status?: RgbLightDeviceStatus;
}

export interface TempSensorDevice extends BaseDevice {
  config: TempSensorConfiguration;
  status?: TempSensorDeviceStatus;
}

export interface BaseConfiguration {
  pinConfig: BasePin;
  moduleToken: string;
  validCommands: Array<number>;
  isAnalogPower: boolean;
}

export interface RgbLightConfiguration extends BaseConfiguration {
  pinConfig: RgbLightPin;
}

export interface TempSensorConfiguration extends BaseConfiguration {
  pinConfig: TempSensorPin;
}

export interface BasePin {
  pin: number;
  pinCheck?: number;
}

export interface RgbLightPin extends BasePin {
  redPin: number;
  greenPin: number;
  bluePin: number;
}

export interface TempSensorPin extends BasePin {
  dataPin: number;
}

export interface Status {
  power: number;
}

export interface RgbLightStatus extends Status {
  redValue: number;
  greenValue: number;
  blueValue: number;
}

export interface TempSensorStatus extends Status {
  temperature: number;
  humidity: number;
}

export interface DeviceStatus {
  futureStatus: Status;
  currentStatus: Status;
  lastStatus: Status;
}

export interface RgbLightDeviceStatus {
  futureStatus: RgbLightStatus;
  currentStatus: RgbLightStatus;
  lastStatus: RgbLightStatus;
}

export interface TempSensorDeviceStatus {
  futureStatus: TempSensorStatus;
  currentStatus: TempSensorStatus;
  lastStatus: TempSensorStatus;
}

export interface OutputSettings {
  automaticTimings: AutomaticTimings;
  timeoutTime: number;
}

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

export interface CalendarDate {
  index: number;
  date: number;
  day: number;
  month: number;
  timestamp: number;
  dayString: string;
  isDiffMonth: boolean;
  isToday: boolean;
  selected: boolean;
}

export interface Calendar {
  selectedDates: Array<number>;
  month: number;
  year: number;
}

export interface Command {
  id: number;
  deviceId: number;
  payload: Array<string>;
}

export interface Time {
  hour: number;
  minute: number;
  second: number;
}

export enum DeviceType {
  None = "NONE",
  OutputDevice = "OUTPUT_DEVICE",
  InputDevice = "INPUT_DEVICE",
  RgbLight = "RGB_LIGHT",
  TempSensor = "TEMPERATURE_SENSOR",
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
  Color = 2,
  ColorChanged = 3,
  TemperatureChanged = 4,
}
