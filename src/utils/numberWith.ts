// NOTE: Both functions are the same, could be merged into one with a parameter for the separator
// -richardscull

export function numberWithSpaces(number: number | string) {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

export function numberWithDots(number: number | string) {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
