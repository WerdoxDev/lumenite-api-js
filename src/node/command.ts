import chalk from "chalk";
import readline, { Key } from "readline";
import { cursor, erase, stripAnsi } from "./ansi";
import MuteStream from "mute-stream";
import { Client, GatewayOptions, Protocol, ResultCode, RgbLightDeviceClass } from "../core";
import { addToString, buildCommand, removeFromString, stringJson } from "../util";

let currentPrompt: Prompt | undefined;
let content = "";
let renderHeight = 0;
let cursorOffset = 0;
let cursorX = 0;
let commandLine = "";
const prompAnswers: Array<Answer> = [];

const output = new MuteStream();
output.pipe(process.stdout);

if (process.stdin.isTTY) process.stdin.setRawMode(true);
const input = process.stdin;

readline.emitKeypressEvents(process.stdin);

interface Answer {
  name: string;
  result: string;
}

interface InputQuestion {
  type: "input";
  name: string;
  message: string;
  required?: boolean;
}

interface SelectQuestion {
  type: "select";
  name: string;
  message: string;
  choices: Array<string>;
}

type Question = InputQuestion | SelectQuestion;
type Prompt = InputPrompt | SelectPrompt;

type QuestionCollection = Array<Question>;

const questions: QuestionCollection = [
  {
    type: "input",
    name: "url",
    message: "What's the URL?",
    required: true,
  },
  {
    type: "select",
    name: "protocol",
    message: "Select the Protocol",
    choices: ["mqtt", "mqtts", "ws", "wss"],
  },
  {
    type: "input",
    name: "gateway_username",
    message: "What's the Gateway Username?",
  },
  {
    type: "input",
    name: "gateway_password",
    message: "What's the Gateway Password?",
  },
  {
    type: "input",
    name: "account_username_or_email",
    message: "What's the Account Username or Email?",
  },
  {
    type: "input",
    name: "account_password",
    message: "What's the Account Password?",
  },
];

async function prompt(questions: QuestionCollection) {
  const prompts: Array<Prompt> = [];
  questions.forEach((x) => {
    if (x.type === "input") {
      const inputPrompt = new InputPrompt(x.name, x.message, x.required);
      prompts.push(inputPrompt);
    } else if (x.type === "select") {
      const selectPrompt = new SelectPrompt(x.name, x.message, x.choices || []);
      prompts.push(selectPrompt);
    }
  });
  for (const prompt of prompts) {
    currentPrompt = prompt;
    cursorX = stripAnsi(prompt.prompt()).length;
    await prompt.run();
  }
  output.write(cursor.hide());
  currentPrompt = undefined;
  cursorX = 0;
  return prompAnswers;
}

class InputPrompt implements InputQuestion {
  type: "input";
  name: string;
  message: string;
  required: boolean;
  currentLine = "";
  onSubmit: (resolved: boolean) => void;
  constructor(name: string, message: string, required = false) {
    this.type = "input";
    this.name = name;
    this.message = message;
    this.required = required;
  }

  render(add = true, isError = false) {
    const error = chalk.red.bold("\n\nThis field is required!");
    const prompt = this.prompt();
    content = content.replace(prompt, "");
    content = content.replace(error, "");
    if (add) {
      content += prompt;
      if (isError) {
        content += error;
      }
      render();
      if (isError) {
        output.write(cursor.up(2) + cursor.left(stripAnsi(error).length - stripAnsi(prompt).length - 1));
        cursorOffset = 2;
      }
    }
  }

  run() {
    output.write(cursor.show());
    this.render();
    return new Promise((resolve) => {
      this.onSubmit = resolve;
    });
  }

  submit(): boolean {
    if (this.required && this.result() === "") {
      this.render(true, true);
      return false;
    }
    this.render(false);
    content += this.prompt() + chalk.blue.bold(`${this.result()}\n`);
    render();
    return true;
  }

  result() {
    return stripAnsi(this.currentLine);
  }

  prompt() {
    return chalk.green("? ") + chalk.bold(`${this.message} `);
  }
}

class SelectPrompt implements SelectQuestion {
  type: "select";
  name: string;
  message: string;
  choices: string[];
  currentChoice = 0;
  onSubmit: (resolved: boolean) => void;
  constructor(name: string, message: string, choices: Array<string>) {
    this.type = "select";
    this.name = name;
    this.message = message;
    this.choices = choices;
  }

  render(add = true) {
    let prompt = this.prompt();
    this.choices?.forEach((x, index) => {
      const isSelected = index === this.currentChoice;
      prompt += `\n ${isSelected ? chalk.blue.bold("> ") : "  "} ${isSelected ? chalk.blue.bold.underline(x) : x}`;
    });
    content = content.replace(prompt, "");
    if (add) {
      content += prompt;
      render();
    }
  }

  run() {
    output.write(cursor.hide());
    this.render();
    return new Promise((resolve) => {
      this.onSubmit = resolve;
    });
  }

  submit(): boolean {
    this.render(false);
    content += this.prompt() + chalk.blue.bold(`${this.result()}\n`);
    render();
    return true;
  }

  result() {
    return stripAnsi(this.choices[this.currentChoice]);
  }

  prompt() {
    return chalk.green("? ") + chalk.bold(`${this.message} `);
  }
}

function render() {
  output.write(cursor.down(cursorOffset));
  output.write(erase.lines(renderHeight));
  output.write(content);
  renderHeight = content.split("\n").length;
  cursorOffset = 0;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function debug(text: string): void {
  output.write(cursor.up(1) + erase.line + text + cursor.down(1) + cursor.left(text.length));
}

input.on("keypress", (str: string, key: Key) => {
  if (key.name === "c" && key.ctrl) {
    output.write(chalk.magenta.bold("\n\nExited with code 0\n"));
    output.write(cursor.show());
    process.exit();
  }
  if (currentPrompt?.type === "input" || !currentPrompt) {
    const promptLength = currentPrompt ? stripAnsi(currentPrompt.prompt()).length : 0;
    if (key.name === "left") {
      if (currentPrompt) {
        if (cursorX - 1 < promptLength) return;
      } else if (cursorX - 1 < 0) {
        return;
      }
      cursorX--;
      output.write(cursor.left(1));
    } else if (key.name === "right") {
      if (currentPrompt && currentPrompt.type === "input") {
        if (cursorX + 1 > promptLength + currentPrompt.currentLine.length) return;
      } else if (cursorX + 1 > commandLine.length) return;
      cursorX++;
      output.write(cursor.right(1));
    } else if (key.name === "backspace") {
      if (currentPrompt && currentPrompt.type === "input") {
        if (cursorX - 1 < promptLength) return;
        currentPrompt.currentLine = removeFromString(currentPrompt.currentLine, cursorX - promptLength);
        cursorX--;
        const subStringLine = currentPrompt.currentLine.substring(cursorX - promptLength, currentPrompt.currentLine.length);
        output.write(cursor.left(1) + erase.lineEnd + subStringLine + cursor.left(subStringLine.length));
      } else {
        if (cursorX - 1 < 0) return;
        commandLine = removeFromString(commandLine, cursorX);
        cursorX--;
        const subStringLine = commandLine.substring(cursorX, commandLine.length);
        output.write(cursor.left(1) + erase.lineEnd + subStringLine + cursor.left(subStringLine.length));
      }
    } else if (key.name === "home") {
      //? Whats the mamad? This
      if (currentPrompt && currentPrompt.type === "input") {
        output.write(cursor.left(currentPrompt.currentLine.substring(0, cursorX - promptLength).length));
      } else {
        output.write(cursor.left(commandLine.length));
      }
      cursorX = promptLength;
    } else if (key.name === "end") {
      if (currentPrompt && currentPrompt.type === "input") {
        output.write(cursor.right(currentPrompt.currentLine.substring(cursorX - promptLength, currentPrompt.currentLine.length).length));
        cursorX = promptLength + currentPrompt.currentLine.length;
      } else {
        output.write(cursor.right(commandLine.substring(cursorX, commandLine.length).length));
        cursorX = commandLine.length;
      }
    } else if (str && str !== "\r") {
      if (currentPrompt && currentPrompt.type === "input") {
        currentPrompt.currentLine = addToString(currentPrompt.currentLine, cursorX - promptLength, str.replace("\r", ""));
        cursorX++;
        const subStringLine = currentPrompt.currentLine.substring(cursorX - promptLength, currentPrompt.currentLine.length);
        output.write(str + subStringLine + cursor.left(subStringLine.length));
      } else {
        commandLine = addToString(commandLine, cursorX, str.replace("\r", ""));
        cursorX++;
        const subStringLine = commandLine.substring(cursorX, commandLine.length);
        output.write(str + subStringLine + cursor.left(subStringLine.length));
      }
    }
  } else if (currentPrompt.type === "select" && (key.name === "up" || key.name === "down")) {
    currentPrompt.render(false);
    const offset = key.name === "up" ? -1 : 1;
    currentPrompt.currentChoice = (currentPrompt.currentChoice + offset + currentPrompt.choices.length) % currentPrompt.choices.length;
    currentPrompt.render();
  }
  if (key.name === "return") {
    if (currentPrompt) {
      if (!currentPrompt.submit()) return;
      const answer: Answer = {
        name: currentPrompt.name,
        result: currentPrompt.result(),
      };
      prompAnswers.push(answer);
      currentPrompt.onSubmit(true);
    } else {
      const command = commandLine.split(" ");
      if (command[0] === "power") {
        if (command.length < 2) return;
        if (command.length === 3) client.deviceById(Number(command[1])).setPower(Number(command[2]));
        else client.devices[Number(command[1])].togglePower();
      } else if (command[0] === "color") {
        if (command.length < 3) return;
        if (command.length === 5)
          client.deviceById<RgbLightDeviceClass>(Number(command[1])).setColor(Number(command[2]), Number(command[3]), Number(command[4]));
      } else if (command[0] === "lcd_text") {
        // lcd_text 0 0 hello
        if (command.length < 4) return;
        const cmd = buildCommand(11, 10, [command[1], command[2], command.slice(3, command.length).join(" ")]);
        client.gateway?.mqttClient.publish(`module/${client.deviceById(0).config.moduleToken}/execute-command`, stringJson(cmd));
      } else if (command[0] === "current_power") {
        if (command.length < 2) return;
        console.log(client.deviceById(Number(command[1])).status?.currentStatus);
      }
      commandLine = "";
      cursorX = 0;
      output.write("\n");
    }
  }
  // if (key.name === "y") render();
});

let client: Client;
export async function showPrompt(): Promise<void> {
  const answers = await prompt(questions);
  output.write(chalk.yellow.bold("\nInitializing..."));
  const url = answers.find((x) => x.name === "url")?.result || "";
  const protocol = answers.find((x) => x.name === "protocol")?.result || "mqtt";
  const gatewayUsername = answers.find((x) => x.name === "gateway_username")?.result;
  const gatewayPassword = answers.find((x) => x.name === "gateway_password")?.result;
  const accountUsernameOrEmail = answers.find((x) => x.name === "account_username_or_email")?.result || "";
  const accountPassword = answers.find((x) => x.name === "account_password")?.result || "";
  const options: GatewayOptions = { url, protocol: protocol as Protocol, username: gatewayUsername, password: gatewayPassword };
  client = new Client(options);
  output.write(chalk.cyan.bold("\nConnecting..."));
  const result = await client.login({ usernameOrEmail: accountUsernameOrEmail, password: accountPassword });
  if (result !== ResultCode.Success) {
    output.write(chalk.red.bold("\nFailed to connect"));
    return;
  }
  output.write(chalk.green.bold("\nConnected!\n\n" + cursor.show()));
}
