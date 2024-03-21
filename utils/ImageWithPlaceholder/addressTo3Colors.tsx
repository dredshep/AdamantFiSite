import { HexString } from "@/types";

export default function addressTo3Colors(address: HexString): string {
  const hexColors = address.slice(2);
  const color1 = hexColors.slice(0, 6);
  const color2 = hexColors.slice(6, 12);
  const color3 = hexColors.slice(12, 18);
  return `shape1Color=${color1}&shape2Color=${color2}&shape3Color=${color3}`;
}
