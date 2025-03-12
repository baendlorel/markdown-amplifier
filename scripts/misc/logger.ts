/**
 * @name Logger
 * @description
 * 依赖于locale
 */

import chalk from 'chalk';
import { i } from './locale';

export const log = (zh: string, en?: string) =>
  en === undefined ? console.log(zh) : console.log(i(zh, en));

export const lred = (zh: string, en?: string) =>
  en === undefined ? console.log(chalk.red(zh)) : console.log(chalk.red(i(zh, en)));
export const lbgRed = (zh: string, en?: string) =>
  en === undefined ? console.log(chalk.bgRed(zh)) : console.log(chalk.bgRed(i(zh, en)));

export const lgrey = (zh: string, en?: string) =>
  en === undefined ? console.log(chalk.grey(zh)) : console.log(chalk.grey(i(zh, en)));
export const lbgGrey = (zh: string, en?: string) =>
  en === undefined ? console.log(chalk.bgGrey(zh)) : console.log(chalk.bgGrey(i(zh, en)));

export const lblue = (zh: string, en?: string) =>
  en === undefined ? console.log(chalk.blue(zh)) : console.log(chalk.blue(i(zh, en)));
export const lbgBlue = (zh: string, en?: string) =>
  en === undefined ? console.log(chalk.bgBlue(zh)) : console.log(chalk.bgBlue(i(zh, en)));
