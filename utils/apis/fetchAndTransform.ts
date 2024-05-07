export async function fetchAndTransform<T>(
  url: string,
  transformer: (data: any) => T = (data) => data
): Promise<T> {
  const response = await fetch(url);
  const data = await response.json();
  return transformer(data);
}
