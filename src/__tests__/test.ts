import { RgbLightDeviceClass } from "../classes";
import { Client, GatewayOptions, ResultCode } from "../index.node";
import { getRandomInt } from "../util";

(async () => {
  const options: GatewayOptions = {
    url: "128.65.178.12",
    port: 1883,
    protocol: "mqtt",
  };

  const client: Client = new Client(options);
  const result = await client.login({ usernameOrEmail: "matin.tat85@gmail.com", password: "matin1385" });
  if (result !== ResultCode.Success) return;

  setInterval(() => {
    client.deviceById<RgbLightDeviceClass>(9028).setColor(getRandomInt(2) * 255, getRandomInt(2) * 255, getRandomInt(2) * 255);
  }, 1000);
  // console.log(interfaceFromDeviceClass(client.deviceById<RgbLightDeviceClass>(9028)));
})();
