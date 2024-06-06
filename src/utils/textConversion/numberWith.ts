export default function NumberWith(
  number: number | string,
  separator: string = ' '
) {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, separator);
}
