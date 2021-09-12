import { BaseDeviceClass } from "../classes";
import { Client, GatewayOptions } from "../index";

(async function () {
  const options: GatewayOptions = {
    url: "mqtt.flespi.io",
    port: 8883,
    protocol: "mqtts",
    username: "51KUQ6PcUOCnRo3fwEQO5efDsCcLOhBI89sM55PQJh1pwUuQmauffyGvYH5COu8M",
    password: "",
  };

  const client: Client = new Client(options);

  test("MyTest", () => {
    return client.login().then(() => {
      expect(client.devices).toBeTruthy();
    });
  });

  const device = client.deviceById<BaseDeviceClass>(1);

  setInterval(() => {
    device.togglePower();
  }, 1000);
})();
