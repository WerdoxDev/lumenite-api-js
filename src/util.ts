import {
  Time,
  DeviceType,
  OutputSettings,
  Status,
  StatusType,
  DeviceStatus,
  CommandType,
  Command,
  RgbLightStatus,
  TempSensorStatus,
  BaseDevice,
  RgbLightDeviceClass,
  OutputDevice,
  OutputDeviceClass,
  RgbLightDevice,
  TempSensorDevice,
  TempSensorDeviceClass,
  BaseDeviceClass,
} from "./classes";
const generatedIds: Array<string> = [];

export function getRandomId(): string {
  function generate() {
    let result = "";
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const charactersLength = characters.length;
    for (let i = 0; i < 16; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }

  let id = generate();
  while (generatedIds.some((x) => x === id)) {
    id = generate();
  }

  return id;
}

export function getRandomInt(max: number, min = 0): number {
  return clamp(Math.floor(Math.random() * max), min, max);
}

export function clamp(number: number, min: number, max: number): number {
  return Math.min(Math.max(number, min), max);
}

export function emptyTime(): Time {
  return {
    hour: 0,
    minute: 0,
    second: 0,
  };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function emptySettings(type?: DeviceType): OutputSettings {
  const value: OutputSettings = {
    automaticTimings: [],
    timeoutTime: 3000,
  };
  return value;
}

export function getMsFromTime(time: Time | undefined): number {
  if (!time) return 0;
  return time.hour * 3600000 + time.minute * 60000 + time.second * 1000;
}

export function getTimeFromMs(ms: number): Time {
  const time: Time = { hour: 0, minute: 0, second: 0 };
  const seconds = Math.floor((ms / 1000) % 60),
    minutes = Math.floor((ms / (1000 * 60)) % 60),
    hours = Math.floor((ms / (1000 * 60 * 60)) % 24);

  time.hour = hours;
  time.minute = minutes;
  time.second = seconds;

  return time;
}

export function emptyDeviceStatus(type?: DeviceType): DeviceStatus {
  const value: DeviceStatus = {
    futureStatus: emptyStatus(type),
    currentStatus: emptyStatus(type),
    lastStatus: emptyStatus(type),
  };
  return value;
}

export function emptyStatus(type?: DeviceType): Status {
  let value: Status = {
    power: StatusType.Offline,
  };
  if (type === DeviceType.RgbLight) {
    value = Object.assign(value, { redValue: 0, greenValue: 0, blueValue: 0 } as RgbLightStatus);
  } else if (type === DeviceType.TempSensor) {
    value = Object.assign(value, { temperature: 0, humidity: 0 } as TempSensorStatus);
  }
  return value;
}

export function deviceClassFromInterface<T extends BaseDeviceClass>(device: BaseDevice, mqttClient: import("mqtt").MqttClient): T {
  if (device.type === DeviceType.RgbLight) {
    const actualDevice = device as RgbLightDevice;
    return (device = new RgbLightDeviceClass(
      actualDevice.id,
      actualDevice.name,
      actualDevice.type,
      actualDevice.status,
      actualDevice.config,
      mqttClient
    )) as unknown as T;
  } else if (device.type === DeviceType.TempSensor) {
    const actualDevice = device as TempSensorDevice;
    return new TempSensorDeviceClass(
      actualDevice.id,
      actualDevice.name,
      actualDevice.type,
      actualDevice.status,
      actualDevice.config,
      mqttClient
    ) as unknown as T;
  } else {
    const actualDevice = device as OutputDevice;
    return new OutputDeviceClass(
      actualDevice.id,
      actualDevice.name,
      actualDevice.type,
      actualDevice.status,
      actualDevice.config,
      actualDevice.settings,
      mqttClient
    ) as unknown as T;
  }
}

export function buildCommand(id: CommandType, deviceId: number, payload: Array<string>): Command {
  return { id, deviceId, payload };
}

export function checkTopic(topic: string, match: string, ...ignores: Array<number>): boolean {
  const splitTopic = topic.split("/");
  for (let i = 0; i < ignores.length; i++) {
    if (i > 0) {
      splitTopic.splice(ignores[i] - ignores[i - 1], 1);
    } else {
      splitTopic.splice(ignores[i], 1);
    }
  }
  const newTopic = splitTopic.join("/");
  return newTopic === match;
}

// eslint-disable-next-line @typescript-eslint/ban-types
export function stringJson(json: object): string {
  return JSON.stringify(json);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseJson(string: string): any {
  return JSON.parse(string);
}

export function addToString(string: string, index: number, stringToAdd: string): string {
  return string.substring(0, index) + stringToAdd + string.substring(index, string.length);
}

export function removeFromString(string: string, index: number): string {
  return string.substring(0, index - 1) + string.substring(index, string.length);
}
