interface Suffixes {
  oneObject: string;
  someObjects?: string;
  manyObjects: string;
}

export default function Pluralize(
  number: number,
  word: string,
  suffixes: Suffixes
) {
  if (number <= 0) {
    return word + suffixes.manyObjects;
  } else if (number % 10 === 1 && number % 100 !== 11) {
    return word + suffixes.oneObject;
  } else if (
    [2, 3, 4].includes(number % 10) &&
    ![12, 13, 14].includes(number % 100)
  ) {
    return (
      word +
      (suffixes.someObjects ? suffixes.someObjects : suffixes.manyObjects)
    );
  } else {
    return word + suffixes.manyObjects;
  }
}
