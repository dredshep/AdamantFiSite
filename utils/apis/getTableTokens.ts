import { TableToken } from "@/types/api/TableToken";

export const getTableTokens = async (): Promise<TableToken[]> => {
  const response = await fetch("/api/getTableTokens");
  const data: TableToken[] = await response.json();
  return data;
};
