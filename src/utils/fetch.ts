export async function CheckIfAvaliable(url: string) {
  try {
    const check = await fetch(url);
    return check;
  } catch (error) {
    return;
  }
}

