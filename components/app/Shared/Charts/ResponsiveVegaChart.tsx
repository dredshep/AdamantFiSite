import { VegaLite, VisualizationSpec } from "react-vega";
import React, { useEffect, useRef } from "react";

const ResponsiveVegaChart = ({
  spec,
  values,
}: {
  spec: VisualizationSpec;
  values: { time: number; value: number }[];
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        // No need to set chartSize in state if not used for rendering,
        // but you might want to keep this setup for future adjustments.
      }
    };

    // Initial size adjustment
    handleResize();

    // Add event listener for window resize
    window.addEventListener("resize", handleResize);

    // Clean up
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Merge the passed spec with dynamic values and potentially responsive width
  const responsiveSpec = {
    ...spec,
    data: {
      ...spec.data,
      values, // Override or set the data values to the provided values
    },
    width: 800,
    // height: "container",
    autosize: { type: "fit", contains: "padding" },
  } as VisualizationSpec;

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", maxWidth: "800px", height: "auto" }}
    >
      <VegaLite spec={responsiveSpec} actions={false} />
    </div>
  );
};

export default ResponsiveVegaChart;
