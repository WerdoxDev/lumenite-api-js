import { Time, DeviceType, OutputSettings, Status, StatusType } from "./classes";

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

export function emptyStatus(type?: DeviceType): Status {
  let value: Status = {
    power: StatusType.Offline,
  };
  if (type === DeviceType.RgbLight) {
    value = Object.assign(value, { redValue: 0, greenValue: 0, blueValue: 0 });
  }
  return value;
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
