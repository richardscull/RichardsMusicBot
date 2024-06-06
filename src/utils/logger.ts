import { styleText } from 'node:util';

export default function log(msg: string, data: unknown = undefined) {
  const date = new Date().toLocaleString();
  const message = styleText(['blueBright'], `🕒 ${date} | ${msg}`);
  console.log(message);
  if (data) {
    console.log(styleText(['blueBright'], '📫 Data:'));
    console.log(data);
    console.log(styleText(['blueBright'], '📪 Data end'));
  }
}

export function error(msg: string, error: unknown | undefined = undefined) {
  const date = new Date().toLocaleString();
  const message = styleText(['redBright'], `🕒 ${date} | ${msg}`);
  console.error(message);
  if (error) {
    console.log(styleText(['redBright'], '📫 Data:'));
    console.error(error);
    console.log(styleText(['redBright'], '📪 Data end'));
  }
}
