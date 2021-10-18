import { getMqttImpl } from "./impl";
import {
  BaseDevice,
  BaseDeviceClass,
  Command,
  DeviceStatus,
  DeviceType,
  OutputDevice,
  OutputDeviceClass,
  OutputSettings,
  RgbLightDevice,
  RgbLightDeviceClass,
  TempSensorDevice,
  TempSensorDeviceClass,
} from "../classes";
import { Client, ClientConfiguration, GatewayOptions } from "./index";
import { checkTopic, deviceClassFromInterface, emptyStatus, getRandomId, parseJson } from "../util";

export class Gateway {
  private readonly timeoutTime = 5000;
  public readonly id = getRandomId();
  private readonly client: Client;
  public mqttClient: import("mqtt").MqttClient;

  constructor(client: Client) {
    this.client = client;
  }

  async connect(options: GatewayOptions): Promise<GatewayStatus> {
    const mqttOptions = {
      hostname: options.protocol === "wss" || options.protocol === "ws" ? options.url : undefined,
      host: options.protocol === "mqtts" || options.protocol === "mqtt" ? options.url : undefined,
      port: options.port,
      username: options.username,
      password: options.password,
      protocol: options.protocol,
      keepalive: 15,
      clientId: this.id,
      will: {
        topic: `client/offline`,
        payload: this.id,
        qos: 0,
        retain: false,
      },
    };

    let timeout: NodeJS.Timeout;
    const result = await new Promise<GatewayStatus>((resolve) => {
      timeout = setTimeout(() => {
        resolve(GatewayStatus.Timeout);
      }, this.timeoutTime);
      this.mqttClient = getMqttImpl().connect(mqttOptions);
      // else this.mqttClient = mqttNode.connect(mqttOptions);
      this.mqttClient.on("connect", async () => {
        this.mqttClient.publish(`client/connect`, this.id);
        const result = await this.defaultSubscribe();
        if (result !== GatewayStatus.Success) resolve(result);
        resolve(GatewayStatus.Success);
      });
      this.mqttClient.on("error", () => {
        resolve(GatewayStatus.Failed);
      });
    }).finally(() => clearTimeout(timeout));
    return result;
  }

  private async defaultSubscribe(): Promise<GatewayStatus> {
    this.mqttClient.subscribe(`client/${this.id}/set-connected`);
    this.mqttClient.subscribe(`client/${this.id}/initialize`);
    this.mqttClient.subscribe("server/connect");
    this.mqttClient.subscribe("server/offline");

    let timeout: NodeJS.Timeout;
    const result = await new Promise<GatewayStatus>((resolve) => {
      timeout = setTimeout(() => {
        resolve(GatewayStatus.InternalError);
      }, 2500);
      this.mqttClient.on("message", (topic, message) => {
        // console.log(topic + ": " + message.toString());
        if (checkTopic(topic, "server/connect")) {
          this.mqttClient.publish("client/connect", this.id);
        } else if (checkTopic(topic, "server/offline")) {
          // Add later
        } else if (checkTopic(topic, "client/initialize", 1)) {
          const payload: ClientInitializePayload = parseJson(message.toString());
          this.clientInitialize(payload);
        } else if (checkTopic(topic, "client/set-connected", 1)) {
          const payload: ClientSetConnectedPayload = parseJson(message.toString());
          this.clientSetConnected(payload);
        } else if (checkTopic(topic, "module/client/set-devices", 1, 3)) {
          const payload: ClientSetDevicesPayload = parseJson(message.toString());
          this.moduleClientSetDevices(payload);
          resolve(GatewayStatus.Success);
        } else if (checkTopic(topic, "module/execute-client-command", 1)) {
          const command: Command = parseJson(message.toString());
          const device = this.client.devices.find((x) => x.id === command.deviceId);
          if (device) {
            device.executeCommand(command);
          }
        } else if (checkTopic(topic, "server/module/update-device", 2)) {
          const device: BaseDevice = parseJson(message.toString());
          const index = this.client.devices.findIndex((x) => x.id === device.id);
          if (device && index !== -1) {
            this.client.devices.splice(index, 1, deviceClassFromInterface(device, this.mqttClient));
          }
        }
      });
    }).finally(() => clearTimeout(timeout));
    return result;
  }

  private clientInitialize(payload: ClientInitializePayload) {
    const devices: Array<BaseDeviceClass> = [];
    payload.devices.forEach((x) => {
      devices.push(deviceClassFromInterface(x, this.mqttClient));
    });
    this.client.config = payload.config;
    this.client.config.registeredModuleTokens.forEach((x) => {
      this.mqttClient.subscribe(`module/${x}/execute-client-command`);
      this.mqttClient.subscribe(`module/${x}/device-settings-changed`);
      this.mqttClient.subscribe(`module/${x}/client/${this.id}/set-devices`);
      this.mqttClient.subscribe(`server/module/${x}/update-device`);
    });
    this.mqttClient.publish(`client/${this.id}/initialize-finished`, "");
    console.log(devices[0].name);
    this.client.devices = devices;
  }

  private clientSetConnected(payload: ClientSetConnectedPayload) {
    this.client.connectedClients = payload[0];
    this.client.connectedModules = payload[1];
  }

  private moduleClientSetDevices(payload: ClientSetDevicesPayload) {
    const devices = [...this.client.devices];
    devices.forEach((x) => {
      const index = payload.findIndex((y) => y.id === x.id);
      x.status = {
        futureStatus: emptyStatus(),
        currentStatus: payload[index].status?.currentStatus || emptyStatus(),
        lastStatus: emptyStatus(),
      };
    });
    this.client.devices = devices;
  }
}

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

export enum GatewayStatus {
  Success = "SUCCESS",
  Timeout = "TIMEOUT",
  Failed = "FAILED",
  InternalError = "INTERNAL_ERROR",
}
