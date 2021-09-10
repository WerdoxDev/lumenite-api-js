import { BaseDeviceClass, OutputDeviceClass } from "./classes";
import { getDeviceById, login } from "./client";
import { GatewayOptions, StatusType } from "./types";

(async function () {
  const options: GatewayOptions = {
    url: "211b94aa7734472e8c384db21d25fc6d.s2.eu.hivemq.cloud",
    port: 8883,
    protocol: "mqtts",
    username: "lumenite",
    password: "Lumenite2021"
  };

  await login(options);

  const device = getDeviceById<BaseDeviceClass>(1);
  let power = 0;
    // device.setPower(StatusType.Off);
  setInterval(() => {
    device.setPower(power);
    power = power === 1 ? 0 : 1;
  }, 1000);
})();
