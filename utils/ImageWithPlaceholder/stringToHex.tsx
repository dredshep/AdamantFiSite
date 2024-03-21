import { HexString } from "@/types";

function stringToHex(str: string): HexString {
  return str
    .split("")
    .map((c) => ("0" + c.charCodeAt(0).toString(16)).slice(-2))
    .join("") as HexString;
}

export default stringToHex;
