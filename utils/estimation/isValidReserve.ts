import Decimal from "decimal.js";

export const isValidReserve = (
  reserve: unknown
): reserve is { amount: Decimal; decimals: number } => {
  return (
    reserve !== null &&
    typeof reserve === "object" &&
    "amount" in reserve &&
    reserve.amount instanceof Decimal &&
    "decimals" in reserve &&
    typeof reserve.decimals === "number"
  );
};
