import React, { useEffect, useState, useRef } from "react";
import { VegaLite, VisualizationSpec } from "react-vega";
import { useResizeObserver } from "@/hooks/useResizeObserver";
import { getTinyChartData } from "@/utils/apis/getTinyChartData";
import { TinyVegaChartProps } from "@/types/charts";
import { determineTrend, createSpec } from "@/utils/charts";

const TinyVegaChart: React.FC<TinyVegaChartProps> = ({ tokenAddress }) => {
  const [spec, setSpec] = useState<VisualizationSpec>({});
  const containerRef = useRef<HTMLDivElement>(null);

  useResizeObserver(containerRef, ([entry]) =>
    updateSpecWidth(entry.contentRect.width)
  );

  useEffect(() => {
    const fetchDataAndUpdateSpec = async () => {
      const values = await getTinyChartData(tokenAddress);
      const trend = determineTrend(values);
      const newSpec = createSpec(values, trend);
      setSpec(newSpec);
    };

    fetchDataAndUpdateSpec();
  }, [tokenAddress]);

  const updateSpecWidth = (width: number) => {
    setSpec((currentSpec) => ({ ...currentSpec, width }));
  };

  return (
    <div ref={containerRef} style={{ width: "100%", height: "30px" }}>
      <VegaLite spec={spec} actions={false} />
    </div>
  );
};

export default TinyVegaChart;
