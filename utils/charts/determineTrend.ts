import { ChartValue } from "@/types/charts";

export const determineTrend = (
  values: ChartValue[]
): "growing" | "ungrowing" => {
  return values[values.length - 1].value > values[0].value
    ? "growing"
    : "ungrowing";
};
