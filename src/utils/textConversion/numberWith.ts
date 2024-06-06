export default function NumberWith(number: number | string, separator = ' ') {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, separator);
}
