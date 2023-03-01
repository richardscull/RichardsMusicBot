export function pluralize(number: number, word: string) {
  if (number % 10 === 1 && number % 100 !== 11) {
    return word;
  } else if (
    [2, 3, 4].includes(number % 10) &&
    ![12, 13, 14].includes(number % 100)
  ) {
    return word + 'а';
  } else {
    return word + 'ов';
  }
}
