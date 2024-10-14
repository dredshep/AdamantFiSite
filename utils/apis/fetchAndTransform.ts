export async function fetchAndTransform<T>(
  url: string,
  transformer: (data: unknown) => T = (data) => data as T
): Promise<T> {
  const response = await fetch(url);
  const data = await response.json();
  return transformer(data);
}
