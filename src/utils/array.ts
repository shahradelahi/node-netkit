export function removeDuplicate<T>(d: T[]): T[] {
  const final: T[] = [];
  for (const item of d) {
    if (!final.includes(item)) {
      final.push(item);
    }
  }
  return final;
}
