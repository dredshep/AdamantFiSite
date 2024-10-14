export async function fetchAndTransform<T>(
  url: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transformer: (data: any) => T = (data) => data as T
): Promise<T> {
  const response = await fetch(url);
  const data = await response.json();
  return transformer(data);
}
