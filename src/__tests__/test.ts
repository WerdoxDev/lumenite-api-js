import { setMqttImpl } from "../core/impl";
import { showPrompt } from "../node/command";
import * as mqtt from "mqtt";
setMqttImpl(mqtt);

showPrompt();
