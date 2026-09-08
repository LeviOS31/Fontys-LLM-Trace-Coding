"use client";

import * as React from "react";
import { Pie, PieChart } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useAxialStore } from "@/state/axial";

export default function TracelistStats() {
  const axialCodes = useAxialStore((s) => s.axialCodes);

  if (!axialCodes || axialCodes.length === 0) {
    return null;
  }

  const chartData = axialCodes
    .map((code) => {
      const connectionsCount =
        code.connections?.filter((c) => c.trace.openCode).length ??
        code.connections?.length ??
        0;
      return {
        id: code.id,
        value: connectionsCount,
        fill: `var(--color-${code.id})`,
      };
    })
    .filter((data) => data.value > 0);

  if (chartData.length === 0) {
    return null;
  }

  const chartConfig = axialCodes.reduce((config, code, index) => {
    config[code.id] = {
      label: code.title,
      color: `hsl(${index * 80} 80 50)`,
    };
    return config;
  }, {} as ChartConfig);

  return (
    <div className="w-full max-w-md mx-auto mt-8">
      <ChartContainer
        config={chartConfig}
        className="mx-auto aspect-square bg-neutral-100 p-5 shadow-xl rounded-xl max-h-100"
      >
        <p className="block whitespace-nowrap font-semibold -mb-4 text-lg text-center">
          Gekoppelde opencodes per axial code
        </p>
        <PieChart>
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel />}
          />
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="id"
            innerRadius={60}
            strokeWidth={5}
          ></Pie>
          <ChartLegend
            content={<ChartLegendContent nameKey="id" />}
            className=""
          />
        </PieChart>
      </ChartContainer>
    </div>
  );
}
