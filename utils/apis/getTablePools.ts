import { TablePoolResponse } from '@/pages/api/getTablePools';

export const getTablePools = async (): Promise<TablePoolResponse> => {
  const response = await fetch('/api/getTablePools');
  const rawData = (await response.json()) as unknown;
  const data = rawData as TablePoolResponse;
  return data;
};
