import { ChartValue } from "@/types/charts";
import { VisualizationSpec } from "react-vega";

export const createSpec = (
  values: ChartValue[],
  trend: "growing" | "ungrowing"
): VisualizationSpec => {
  const color = trend === "growing" ? "green" : "red";

  return {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    width: 65,
    height: 30,
    background: "transparent",
    data: { values },
    mark: {
      type: "line",
      strokeWidth: 3,
      color,
    },
    encoding: {
      x: { field: "time", type: "quantitative", axis: null },
      y: { field: "value", type: "quantitative", axis: null },
    },
    config: {
      view: { stroke: "none" },
    },
  };
};
