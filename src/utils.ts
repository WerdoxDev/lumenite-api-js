import { DeviceType, Status, StatusType } from "./types";

var generatedIds: Array<string> = [];

export function getRandomId() {
  function generate() {
    var result = "";
    var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    var charactersLength = characters.length;
    for (var i = 0; i < 16; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }

  var id = generate();
  while (generatedIds.some((x) => x === id)) {
    id = generate();
  }

  return id;
}

export function emptyStatus(type?: DeviceType): Status {
  var value: Status = {
    power: StatusType.Offline,
  };
  if (type === DeviceType.RgbLight) {
    value = Object.assign(value, { redValue: 0, greenValue: 0, blueValue: 0 });
  }
  return value;
}
export function checkTopic(topic: string, match: string, ...ignores: Array<number>) {
  var splitTopic = topic.split("/");
  for (let i = 0; i < ignores.length; i++) {
    if (i > 0) {
      splitTopic.splice(ignores[i] - ignores[i - 1], 1);
    } else {
      splitTopic.splice(ignores[i], 1);
    }
  }
  var newTopic = splitTopic.join("/");
  return newTopic === match;
}

export function stringJson(json: object) {
  return JSON.stringify(json);
}

export function parseJson(string: string) {
  return JSON.parse(string);
}
