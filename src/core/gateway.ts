import { getMqttImpl } from "./impl";
import { BaseDevice, BaseDeviceClass, Command, DeviceStatus, DeviceType, OutputSettings } from "../classes";
import { Client, GatewayOptions } from "./index";
import { checkTopic, deviceClassFromInterface, emptyStatus, getRandomId, parseJson, stringJson } from "../util";

export class Gateway {
  private readonly timeoutTime = 10000;
  public readonly id = getRandomId();
  private readonly client: Client;
  public mqttClient: import("mqtt").MqttClient;
  private _loginCredentials: LoginCredentials;

  constructor(client: Client) {
    this.client = client;
  }

  async connect(loginCredentials: LoginCredentials, options: GatewayOptions): Promise<ResultCode> {
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

    this._loginCredentials = loginCredentials;

    let timeout: NodeJS.Timeout;
    const result = await new Promise<ResultCode>((resolve) => {
      timeout = setTimeout(() => {
        resolve(ResultCode.Timeout);
      }, this.timeoutTime);
      this.mqttClient = getMqttImpl().connect(mqttOptions);

      this.mqttClient.on("connect", async () => {
        this.mqttClient.publish(`client/${this.id}/login`, stringJson([this._loginCredentials, this.id]));
        const result = await this.defaultSubscribe();
        resolve(result);
      });
      this.mqttClient.on("error", () => {
        resolve(ResultCode.InternalError);
      });
    }).finally(() => clearTimeout(timeout));
    return result;
  }

  disconnect(): void {
    this.mqttClient?.publish("client/offline", this.id);
  }

  private async defaultSubscribe(): Promise<ResultCode> {
    this.mqttClient.subscribe(`client/${this.id}/login-finished`);
    this.mqttClient.subscribe(`client/${this.id}/set-connected`);
    this.mqttClient.subscribe(`client/${this.id}/initialize`);
    this.mqttClient.subscribe("server/connect");
    this.mqttClient.subscribe("server/offline");

    let timeout: NodeJS.Timeout;
    const result = await new Promise<ResultCode>((resolve) => {
      timeout = setTimeout(() => {
        console.log("Timeout");
        resolve(ResultCode.InternalError);
      }, this.timeoutTime);
      this.mqttClient.on("message", (topic, message) => {
        console.log(topic + ": " + message.toString() + "\n");
        if (checkTopic(topic, "server/connect")) {
          this.mqttClient.publish(`client/${this.id}/login`, stringJson([this._loginCredentials, this.id]));
        } else if (checkTopic(topic, "server/offline")) {
          // Add later
        } else if (checkTopic(topic, "client/initialize", 1)) {
          const payload: ClientInitializePayload = parseJson(message.toString());
          const result = this.initialize(payload);
          if (result) resolve(result);
        } else if (checkTopic(topic, "client/set-connected", 1)) {
          const payload: ClientSetConnectedPayload = parseJson(message.toString());
          this.setConnected(payload);
          resolve(ResultCode.Success);
        } else if (checkTopic(topic, "module/client/set-devices", 1, 3)) {
          const payload: ClientSetDevicesPayload = parseJson(message.toString());
          this.setDevices(payload);
        } else if (checkTopic(topic, "module/client/update-device", 1)) {
          const payload: UpdateDevicePayload = parseJson(message.toString());
          this.updateDevice(payload);
        } else if (checkTopic(topic, "module/execute-client-command", 1)) {
          const command: Command = parseJson(message.toString());
          const device = this.client.devices.find((x) => x.id === command.deviceId);
          if (device) device.executeCommand(command);
        }
      });
    }).finally(() => clearTimeout(timeout));
    return result;
  }

  private initialize(payload: ClientInitializePayload) {
    if (payload.result.code === ResultCode.WrongCredentials || payload.result.code === ResultCode.InternalError) return payload.result.code;
    const devices: Array<BaseDeviceClass> = [];
    payload.devices.forEach((x) => {
      devices.push(deviceClassFromInterface(x, this.mqttClient));
    });
    if (payload.result.user) this.client.user = payload.result.user;
    this.client.user?.modulesTokens.forEach((x) => {
      this.mqttClient.subscribe(`module/${x}/execute-client-command`);
      this.mqttClient.subscribe(`module/${x}/device-settings-changed`);
      this.mqttClient.subscribe(`module/${x}/client/${this.id}/set-devices`);
      this.mqttClient.subscribe(`module/${x}/client/${this.id}/update-device`);
      this.mqttClient.subscribe(`module/${x}/client/update-device`);
    });
    this.mqttClient.publish(`client/${this.id}/initialize-finished`, "");
    this.client.totalModules = this.client.user?.modulesTokens.length;
    this.client.devices = devices;
  }

  private setConnected(payload: ClientSetConnectedPayload) {
    this.client.connectedClients = payload[0];
    this.client.connectedModules = payload[1];
  }

  private updateDevice(payload: UpdateDevicePayload) {
    if (payload.operation === "update" || payload.operation === "add") {
      const device = payload.deviceOrId as BaseDevice;
      const index = this.client.devices.findIndex((x) => x.id === device.id);
      if (device && index !== -1) this.client.devices.splice(index, 1);

      this.client.devices.push(deviceClassFromInterface(device, this.mqttClient));
    } else if (payload.operation === "delete") {
      const id = payload.deviceOrId as number;
      const index = this.client.devices.findIndex((x) => x.id === id);
      if (index !== -1) this.client.devices.splice(index, 1);
    }
  }

  private setDevices(payload: ClientSetDevicesPayload) {
    const devices = [...this.client.devices];
    devices.forEach((x) => {
      const index = payload.findIndex((y) => y.id === x.id);
      x.status = {
        futureStatus: emptyStatus(),
        currentStatus: payload[index].status.currentStatus || emptyStatus(),
        lastStatus: emptyStatus(),
      };
    });
    this.client.devices = devices;
  }
}

export interface ClientInitializePayload {
  result: LoginResult;
  devices: Array<BaseDevice>;
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

export interface LoginResult {
  code: ResultCode;
  user?: User;
}

export type ClientSetConnectedPayload = Array<number>;

export type ClientSetDevicesPayload = Array<SetDevicePayload>;

export interface SetDevicePayload {
  id: number;
  status: DeviceStatus;
}

export interface UpdateDevicePayload {
  operation: string;
  deviceOrId: BaseDevice | number;
}

export interface ClientLoginPayload {
  credentials: LoginCredentials;
  id: string;
}

export interface LoginCredentials {
  usernameOrEmail: string;
  password: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  modulesTokens: Array<string>;
}

export enum ResultCode {
  Success = "SUCCESS",
  WrongCredentials = "WRONG_CREDENTIALS",
  Timeout = "TIMEOUT",
  InternalError = "INTERNAL_ERROR",
}
