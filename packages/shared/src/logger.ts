import chalk from "chalk";
import { ChalkTypeOption } from "./types/chalkType";
class Logger {
  error(msg: string) {
    console.log(chalk.bgRed("出现错误"), chalk.bold.red(msg));
  }
  success(msg: string) {
    console.log(chalk.green("=".repeat(80)));
    console.log(chalk.bold.green(msg));
  }
  info(msg: string) {
    console.log(chalk.yellow(msg));
  }
  define(msg: string, type: keyof ChalkTypeOption, isBold: boolean = false) {
    if (isBold) {
      console.log(chalk[type]["blod"](msg));
    } else {
      console.log(chalk[type](msg));
    }
  }
}
export const logger = new Logger();