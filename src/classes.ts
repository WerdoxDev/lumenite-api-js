import { client } from "./gateway";
import {
  OutputDevice,
  OutputSettings,
  DeviceConfiguration,
  DeviceStatus,
  DeviceType,
  StatusType,
  ChangeDeviceStatusPayload,
  Command,
  CommandType,
  Status,
  BaseDevice,
} from "./types";
import { emptyStatus, stringJson } from "./utils";

export class BaseDeviceClass implements BaseDevice {
  config: DeviceConfiguration;
  readonly id: number;
  name: string;
  status?: DeviceStatus | undefined;
  type: DeviceType;

  constructor(id: number, name: string, type: DeviceType, status: DeviceStatus | undefined, config: DeviceConfiguration) {
    this.id = id;
    this.name = name;
    this.type = type;
    this.status = status;
    this.config = config;
  }

  setPower(power: StatusType) {
    this.futureStatus.power = power;
    console.log("1: " + this.currentStatus.power + " " + this.lastStatus.power);
    var temp = this.currentStatus;
    Object.freeze(temp);
    this.currentStatus = this.lastStatus;
    this.lastStatus = temp;
    console.log("2: " + this.currentStatus.power + " " + this.lastStatus.power);

    var command: Command = {
      id: CommandType.Power,
      deviceId: this.id,
      payload: [stringJson(this.futureStatus), stringJson(this.lastStatus)],
    };
    client.publish(`module/${this.config.moduleToken}/execute-command`, stringJson(command));
  }

  //   setStatus(futureStatus: Status, currentStatus: Status, lastStatus: Status): boolean {
  //     if (!this.isInValidState) return false;
  //     this.futureStatus = futureStatus;
  //     this.currentStatus = currentStatus;
  //     this.lastStatus = lastStatus;
  //     var command: Command = {
  //       id: CommandType.Power,
  //       deviceId: this.id,
  //       payload: [stringJson(this.futureStatus), stringJson(this.lastStatus)],
  //     };

  //     store.state.mqtt?.publish(`module/${this.config.moduleToken}/execute-command`, stringJson(command));
  //     return true;
  //   }

  get isInValidState() {
    var currentStatus = this.currentStatus;
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
  oppositePower(power: StatusType): StatusType {
    return power === StatusType.On ? StatusType.Off : StatusType.On;
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
    settings: OutputSettings
  ) {
    super(id, name, type, status, config);
    this.settings = settings;
  }
}
