import { styleText } from 'node:util';

export default function log(msg: string, isForced: boolean = false) {
  const date = new Date().toLocaleString();
  const message = styleText(['blueBright'], `🕒 ${date} | ${msg}`);
  console.log(message);
}

export function error(msg: string, error: unknown | undefined = undefined) {
  const date = new Date().toLocaleString();
  const message = styleText(['redBright'], `🕒 ${date} | ${msg}`);
  console.error(message);
  if (error) console.error(error);
}
