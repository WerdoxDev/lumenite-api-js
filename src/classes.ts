import { MqttClient } from "mqtt";
import {
  BaseDevice,
  Command,
  CommandType,
  DeviceConfiguration,
  DeviceStatus,
  DeviceType,
  OutputDevice,
  OutputSettings,
  Status,
  StatusType,
} from "./types";
import { emptyStatus, parseJson, stringJson } from "./utils";

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

  setPower(power: StatusType) {
    this.futureStatus.power = power;
    var temp = this.currentStatus;
    Object.freeze(temp);
    this.currentStatus = this.lastStatus;
    this.lastStatus = temp;

    var command: Command = {
      id: CommandType.Power,
      deviceId: this.id,
      payload: [stringJson(this.futureStatus), stringJson(this.lastStatus)],
    };
    this.mqttClient.publish(`module/${this.config.moduleToken}/execute-command`, stringJson(command));
  }

  togglePower() {
    this.setPower(this.oppositePower(this.currentStatus));
  }

  executeCommand(command: Command) {
    if (!this.config.validCommands.find((x) => x === command.id)) throw new Error("Command is not valid for device");

    if (command.id === CommandType.PowerChanged) {
      this.currentStatus = parseJson(command.payload[0]);
      console.log("STATUS CHANGED");
    }
  }

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
