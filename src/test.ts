import { BaseDeviceClass, OutputDeviceClass } from "./classes";
import { getDeviceById, login } from "./client";
import { GatewayOptions, StatusType } from "./types";

(async function () {
  const options: GatewayOptions = {
    url: "192.168.1.115",
    port: 1883,
  };

  await login(options);

  var device = getDeviceById<BaseDeviceClass>(0);
  //   device.setPower(StatusType.Off);
  setInterval(() => {
    device.setPower(device.oppositePower(device.currentStatus.power));
  }, 500);
})();
