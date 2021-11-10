// import { RgbLightDeviceClass } from "../classes";
// import { Client, GatewayOptions, GatewayStatus, showPrompt } from "../index.node";
// import { getRandomInt, interfaceFromDeviceClass } from "../util";

// (async () => {
//   const options: GatewayOptions = {
//     url: "128.65.178.12",
//     port: 1883,
//     protocol: "mqtt",
//   };

//   const client: Client = new Client(options);
//   const result = await client.login();
//   if (result !== GatewayStatus.Success) return;

//   // setInterval(() => {
//   //   client.deviceById<RgbLightDeviceClass>(1).setColor(getRandomInt(2) * 255, getRandomInt(2) * 255, getRandomInt(2) * 255);
//   // }, 125);
//   console.log(interfaceFromDeviceClass(client.deviceById<RgbLightDeviceClass>(9028)));
// })();
