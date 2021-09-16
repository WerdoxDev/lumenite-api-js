let mqttImpl: typeof import("mqtt") | undefined;

export function setMqttImpl(impl: typeof import("mqtt")): void {
  mqttImpl = impl;
}

export function getMqttImpl(): typeof import("mqtt") {
  if (mqttImpl === undefined) {
    throw new Error("no mqtt impl was set");
  }
  return mqttImpl;
}
