const isTerm = process.env.TERM_PROGRAM === "Apple_Terminal";

const ESC = "\u001b[";
const BEL = "\u0007";

let hidden = false;

export const code = {
  bell: BEL,
  beep: BEL,
  beginning: `${ESC}G`,
  down: `${ESC}J`,
  esc: ESC,
  getPosition: `${ESC}6n`,
  hide: `${ESC}?25l`,
  line: `${ESC}2K`,
  lineEnd: `${ESC}K`,
  lineStart: `${ESC}1K`,
  restorePosition: ESC + (isTerm ? "8" : "u"),
  savePosition: ESC + (isTerm ? "7" : "s"),
  screen: `${ESC}2J`,
  show: `${ESC}?25h`,
  up: `${ESC}1J`,
};

export const cursor = {
  get hidden(): boolean {
    return hidden;
  },

  hide(): string {
    hidden = true;
    return code.hide;
  },
  show(): string {
    hidden = false;
    return code.show;
  },

  forward: (count = 1): string => `${ESC}${count}C`,
  backward: (count = 1): string => `${ESC}${count}D`,
  nextLine: (count = 1): string => `${ESC}E`.repeat(count),
  prevLine: (count = 1): string => `${ESC}F`.repeat(count),

  up: (count = 1): string => (count ? `${ESC}${count}A` : ""),
  down: (count = 1): string => (count ? `${ESC}${count}B` : ""),
  right: (count = 1): string => (count ? `${ESC}${count}C` : ""),
  left: (count = 1): string => (count ? `${ESC}${count}D` : ""),

  to(x: number, y: number): string {
    return y ? `${ESC}${y + 1};${x + 1}H` : `${ESC}${x + 1}G`;
  },

  move(x = 0, y = 0): string {
    let res = "";
    res += x < 0 ? cursor.left(-x) : x > 0 ? cursor.right(x) : "";
    res += y < 0 ? cursor.up(-y) : y > 0 ? cursor.down(y) : "";
    return res;
  },

  //   restore(state = {}) {
  //     let { after, cursor, initial, input, prompt, size, value } = state;
  //     initial = utils.isPrimitive(initial) ? String(initial) : "";
  //     input = utils.isPrimitive(input) ? String(input) : "";
  //     value = utils.isPrimitive(value) ? String(value) : "";

  //     if (size) {
  //       let codes = ansi.cursor.up(size) + ansi.cursor.to(prompt.length);
  //       let diff = input.length - cursor;
  //       if (diff > 0) {
  //         codes += ansi.cursor.left(diff);
  //       }
  //       return codes;
  //     }

  //     if (value || after) {
  //       let pos = !input && !!initial ? -initial.length : -input.length + cursor;
  //       if (after) pos -= after.length;
  //       if (input === "" && initial && !prompt.includes(initial)) {
  //         pos += initial.length;
  //       }
  //       return ansi.cursor.move(pos);
  //     }
  //   },
};

export const erase = {
  screen: code.screen,
  up: code.up,
  down: code.down,
  line: code.line,
  lineEnd: code.lineEnd,
  lineStart: code.lineStart,
  lines(n: number): string {
    let str = "";
    for (let i = 0; i < n; i++) {
      str += erase.line + (i < n - 1 ? cursor.up(1) : "");
    }
    if (n) str += code.beginning;
    return str;
  },
};

export function stripAnsi(string: string): string {
  return string.replace(ansiRegex(), "").replace("\r", "").replace("\n", "");
}

function ansiRegex(): RegExp {
  const pattern = [
    "[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)",
    "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))",
  ].join("|");

  return new RegExp(pattern, "g");
}
