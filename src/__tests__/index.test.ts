import { GatewayStatus } from "../gateway";
import { Client, GatewayOptions } from "../index";

(async function () {
  const options: GatewayOptions = {
    url: "mqtt.flespi.io",
    protocol: "mqtts",
    username: "51KUQ6PcUOCnRo3fwEQO5efDsCcLOhBI89sM55PQJh1pwUuQmauffyGvYH5COu8M",
    // password: "",
  };

  const client: Client = new Client(options);

  // test("MyTest", async () => {
  //   const result = await client.login();
  //   console.log(result);
  //   expect(result).toBe(GatewayStatus.Success);
  // }, 20000);
  const result = await client.login();
  console.log(result);

  // const device = client.deviceById<BaseDeviceClass>(1);

  // setInterval(() => {
  //   device.togglePower();
  // }, 1000);
})();
