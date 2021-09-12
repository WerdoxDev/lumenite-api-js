import * as mqtt from "mqtt";
import { BaseDevice, BaseDeviceClass, Command, DeviceStatus, DeviceType, OutputDevice, OutputDeviceClass, OutputSettings } from "./classes";
import { Client, ClientConfiguration, GatewayOptions } from ".";
import { checkTopic, emptyStatus, getRandomId, parseJson } from "./util";

export class Gateway {
  public readonly id = getRandomId();
  private readonly client: Client;
  private readonly options: GatewayOptions;
  private mqttClient: mqtt.MqttClient;
  private _config: ClientConfiguration;
  private _connectedClients = 0;
  private _connectedModules = 0;

  constructor(client: Client) {
    this.client = client;
    this.options = client.options;
  }

  async connect(): Promise<void> {
    const mqttOptions: mqtt.IClientOptions = {
      hostname: this.options.protocol === "wss" || this.options.protocol === "ws" ? this.options.url : undefined,
      host: this.options.protocol === "mqtts" || this.options.protocol === "mqtt" ? this.options.url : undefined,
      port: this.options.port,
      username: this.options.username,
      password: this.options.password,
      protocol: this.options.protocol,
      keepalive: 15,
      clientId: this.id,
      will: {
        topic: `client/offline`,
        payload: this.id,
        qos: 0,
        retain: false,
      },
    };

    await new Promise((resolve) => {
      this.mqttClient = mqtt.connect(mqttOptions);
      this.mqttClient.on("connect", async () => {
        this.mqttClient.publish(`client/connect`, this.id);
        await this.defaultSubscribe();
        resolve(0);
      });
    });
  }

  private async defaultSubscribe() {
    if (!this.mqttClient.connected) return;

    this.mqttClient.subscribe(`client/${this.id}/set-connected`);
    this.mqttClient.subscribe(`client/${this.id}/initialize`);
    this.mqttClient.subscribe("server/connect");
    this.mqttClient.subscribe("server/offline");

    await new Promise((resolve) => {
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
          resolve(0);
        } else if (checkTopic(topic, "module/execute-client-command", 1)) {
          const command: Command = parseJson(message.toString());
          const device = this.client.devices.find((x) => x.id === command.deviceId);
          if (device) {
            device.executeCommand(command);
          }
        }
      });
    });
  }

  private clientInitialize(payload: ClientInitializePayload) {
    const devices: Array<BaseDeviceClass> = [];
    payload.devices.forEach((x) => {
      if (x.type === DeviceType.RgbLight) throw new Error("RgbLight is not implemented yet!");
      else {
        const device = new OutputDeviceClass(x.id, x.name, x.type, x.status, x.config, (x as OutputDevice).settings, this.mqttClient);
        devices.push(device);
      }
    });
    this._config = payload._config;
    this._config.registeredModuleTokens.forEach((x) => {
      this.mqttClient.subscribe(`module/${x}/execute-client-command`);
      this.mqttClient.subscribe(`module/${x}/device-settings-changed`);
      this.mqttClient.subscribe(`module/${x}/client/${this.id}/set-devices`);
    });
    this.mqttClient.publish(`client/${this.id}/initialize-finished`, "");
    this.client.devices = devices;
  }

  private clientSetConnected(payload: ClientSetConnectedPayload) {
    this._connectedClients = payload[0];
    this._connectedModules = payload[1];
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

  get connectedModules(): number {
    return this._connectedModules;
  }

  get connectedClients(): number {
    return this._connectedClients;
  }

  get config(): ClientConfiguration {
    return this._config;
  }
}

export interface ChangeDeviceStatusPayload {
  id: number;
  type: DeviceType;
  status: DeviceStatus;
}

export interface ClientInitializePayload {
  devices: Array<BaseDevice>;
  _config: ClientConfiguration;
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
