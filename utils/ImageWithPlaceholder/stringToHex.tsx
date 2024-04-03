import { SecretString } from "@/types";

function stringToHex(str: string): SecretString {
  return str
    .split("")
    .map((c) => ("0" + c.charCodeAt(0).toString(16)).slice(-2))
    .join("") as SecretString;
}

export default stringToHex;
