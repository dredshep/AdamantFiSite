import Decimal from "decimal.js";
import { Path } from "./Path";

export interface PathEstimation {
  path: Path;
  finalOutput: Decimal;
  totalPriceImpact: string;
  totalLpFee: Decimal;
  totalGasCost: string;
  idealOutput: Decimal;
}
