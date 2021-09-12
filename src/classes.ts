import { MqttClient } from "mqtt";
import { stringJson, parseJson, emptyStatus } from "./util";

export class BaseDeviceClass implements BaseDevice {
  readonly id: number;
  config: DeviceConfiguration;
  name: string;
  type: DeviceType;
  status?: DeviceStatus | undefined;

  constructor(
    id: number,
    name: string,
    type: DeviceType,
    status: DeviceStatus | undefined,
    config: DeviceConfiguration,
    private mqttClient: MqttClient
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

    const command: Command = {
      id: CommandType.Power,
      deviceId: this.id,
      payload: [stringJson(this.futureStatus), stringJson(this.lastStatus)],
    };
    this.mqttClient.publish(`module/${this.config.moduleToken}/execute-command`, stringJson(command));
  }

  togglePower(): void {
    this.setPower(this.oppositePower(this.currentStatus));
  }

  executeCommand(command: Command): void {
    if (!this.config.validCommands.find((x) => x === command.id)) throw new Error("Command is not valid for device");

    if (command.id === CommandType.PowerChanged) {
      this.currentStatus = parseJson(command.payload[0]);
      console.log("STATUS CHANGED");
    }
  }

  get isInValidState(): boolean {
    const currentStatus = this.currentStatus;
    return currentStatus.power !== StatusType.Offline && currentStatus.power !== StatusType.Processing;
  }

  get futureStatus(): Status {
    if (this.status !== undefined) return this.status.futureStatus;
    else return emptyStatus();
  }
  set futureStatus(value: Status) {
    if (this.status !== undefined) {
      this.status.futureStatus = value;
    } else throw new Error("FutureStatus was null!");
  }

  get currentStatus(): Status {
    if (this.status !== undefined) return this.status.currentStatus;
    else return emptyStatus();
  }
  set currentStatus(value: Status) {
    if (this.status !== undefined) {
      this.status.currentStatus = value;
    } else throw new Error("CurrentStatus was null!");
  }

  get lastStatus(): Status {
    if (this.status !== undefined) return this.status.lastStatus;
    else return emptyStatus();
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
    config: DeviceConfiguration,
    settings: OutputSettings,
    mqttClient: MqttClient
  ) {
    super(id, name, type, status, config, mqttClient);
    this.settings = settings;
  }
}

export interface Device {
  readonly id: number;
  name: string;
  status?: DeviceStatus;
  readonly type: DeviceType;
}

export interface BaseDevice extends Device {
  config: DeviceConfiguration;
}

// export interface InputDevice extends BaseDevice {}

export interface OutputDevice extends BaseDevice {
  settings: OutputSettings;
}
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
