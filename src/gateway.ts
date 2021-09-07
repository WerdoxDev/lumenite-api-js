import mqtt from "mqtt";
import { BaseDeviceClass, OutputDeviceClass } from "./classes";
import {
  ClientConfiguration,
  ClientInitializePayload,
  ClientSetConnectedPayload,
  ClientSetDevicesPayload,
  DeviceType,
  GatewayOptions,
} from "./types";
import { checkTopic, emptyStatus, getRandomId, parseJson } from "./utils";

const id = getRandomId();
export var client: mqtt.Client;
var config: ClientConfiguration;
var devices: Array<BaseDeviceClass> = [];
var connctedClients = 0,
  connectedModules = 0;

export async function connect(options: GatewayOptions) {
  const mqttOptions: mqtt.IClientOptions = {
    host: options.url,
    port: options.port,
    keepalive: 15,
    will: {
      topic: `client/offline`,
      payload: id,
      qos: 0,
      retain: false,
    },
    // protocol: "mqtts",
  };

  await new Promise((resolve, reject) => {
    client = mqtt.connect(mqttOptions);
    client.on("connect", async () => {
      client.publish(`client/connect`, id);
      await defaultSubscribe();
      resolve(0);
    });
  });
}

export async function defaultSubscribe() {
  if (!client.connected) return;

  client.subscribe(`client/${id}/set-connected`);
  client.subscribe(`client/${id}/initialize`);
  client.subscribe("server/connect");
  client.subscribe("server/offline");

  await new Promise((resolve, reject) => {
    client.on("message", (topic, message) => {
      console.log(topic + ": " + message.toString());
      if (checkTopic(topic, "server/connect")) {
        client.publish(`client/connect`, id);
      } else if (checkTopic(topic, "server/offline")) {
      } else if (checkTopic(topic, "client/initialize", 1)) {
        let payload: ClientInitializePayload = parseJson(message.toString());
        clientInitialize(payload);
      } else if (checkTopic(topic, "client/set-connected", 1)) {
        let payload: ClientSetConnectedPayload = parseJson(message.toString());
        clientSetConnected(payload);
      } else if (checkTopic(topic, "module/client/set-devices", 1, 3)) {
        let payload: ClientSetDevicesPayload = parseJson(message.toString());
        moduleClientSetDevices(payload);
        resolve(0);
      }
    });
  });
}

function clientInitialize(payload: ClientInitializePayload) {
  payload.devices.forEach((x) => {
    if (x.type === DeviceType.RgbLight) throw new Error("RgbLight is not implemented yet!");
    else {
      let device = new OutputDeviceClass(x.id, x.name, x.type, x.status, x.config, x.settings);
      devices.push(device);
    }
  });
  config = payload.config;
  config.registeredModuleTokens.forEach((x) => {
    client.subscribe(`module/${x}/execute-client-command`);
    client.subscribe(`module/${x}/device-settings-changed`);
    client.subscribe(`module/${x}/client/${id}/set-devices`);
  });
  client.publish(`client/${id}/initialize-finished`, "");
}

function clientSetConnected(payload: ClientSetConnectedPayload) {
  connctedClients = payload[0];
  connectedModules = payload[1];
}

function moduleClientSetDevices(payload) {
  devices.forEach((x) => {
    var index = payload.findIndex((y) => y.id === x.id);
    x.status = {
      futureStatus: emptyStatus(),
      currentStatus: payload[index].status?.currentStatus || emptyStatus(),
      lastStatus: emptyStatus(),
    };
  });
}

export function getDevices() {
  return devices;
}
