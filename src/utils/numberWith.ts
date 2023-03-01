export function numberWithSpaces(number: number | string) {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

export function numberWithDots(number: number | string) {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
