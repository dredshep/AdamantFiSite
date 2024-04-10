import { TablePool } from "@/types/api/TablePool";

export const getTablePools = async (): Promise<TablePool[]> => {
  const response = await fetch("/api/getTablePools");
  const data: TablePool[] = await response.json();
  return data;
};
