import { fullPoolsData } from "@/components/app/Testing/fullPoolsData";
export async function fetchPoolData() {
  // console.log({ fullPoolsData });
  return Promise.resolve(fullPoolsData);
}
