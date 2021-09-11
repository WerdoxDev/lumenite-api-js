import { BaseDeviceClass, OutputDeviceClass } from "./classes";
import { Client } from "./client";
import { GatewayOptions, StatusType } from "./types";

(async function () {
  const options: GatewayOptions = {
    url: "mqtt.flespi.io",
    port: 8883,
    protocol: "mqtts",
    username: "51KUQ6PcUOCnRo3fwEQO5efDsCcLOhBI89sM55PQJh1pwUuQmauffyGvYH5COu8M",
    password: "",
  };

  var client: Client = new Client(options);

  await client.login();

  const device = client.deviceById<BaseDeviceClass>(1);
  let power = 0;
  // device.setPower(StatusType.Off);
  setInterval(() => {
    device.setPower(power);
    power = power === 1 ? 0 : 1;
  }, 1000);
})();
