"use client";

import * as React from "react";
import { Label, Pie, PieChart, Sector } from "recharts";
import type { PieSectorShapeProps } from "recharts/types/polar/Pie";

import { useAxialStore } from "@/state/axial";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  ChartContainer,
  ChartStyle,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function AxialCodeDistributionChart() {
  const axialCodes = useAxialStore((s) => s.axialCodes);
  const [activeCode, setActiveCode] = React.useState<string>(
    axialCodes?.[0]?.id ?? "",
  );

  React.useEffect(() => {
    const update = () => {
      if (axialCodes && axialCodes.length > 0) {
        setActiveCode(axialCodes[0].id);
      }
    };
    update();
  }, [axialCodes]);

  const activeIndex = React.useMemo(
    () => axialCodes?.findIndex((code) => code.id === activeCode) ?? -1,
    [activeCode, axialCodes],
  );

  const codes = React.useMemo(
    () => (axialCodes ?? []).map((code) => code.id),
    [axialCodes],
  );

  const renderPieShape = React.useCallback(
    ({ index, outerRadius = 0, ...props }: PieSectorShapeProps) => {
      if (index === activeIndex && activeIndex !== -1) {
        return (
          <g>
            <Sector {...props} outerRadius={outerRadius + 10} />
            <Sector
              {...props}
              outerRadius={outerRadius + 25}
              innerRadius={outerRadius + 12}
            />
          </g>
        );
      }
      return <Sector {...props} outerRadius={outerRadius} />;
    },
    [activeIndex],
  );

  if (!axialCodes || axialCodes.length === 0) {
    return null;
  }

  const totalCodes = axialCodes.length;
  const stops = ["#663366", "#845b84", "#a384a3", "#c1adc1", "#e0d6e0"];

  function hexToRgb(h: string) {
    const v = h.replace("#", "");
    return [
      parseInt(v.slice(0, 2), 16),
      parseInt(v.slice(2, 4), 16),
      parseInt(v.slice(4, 6), 16),
    ];
  }

  function rgbToHex([r, g, b]: number[]) {
    return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
  }

  function lerp(a: number, b: number, t: number) {
    return Math.round(a + (b - a) * t);
  }

  const chartConfig = axialCodes.reduce((config, code, index) => {
    const t = totalCodes > 1 ? index / (totalCodes - 1) : 0;
    const segmentCount = stops.length - 1;
    const scaled = t * segmentCount;
    const segIndex = Math.min(Math.floor(scaled), segmentCount - 1);
    const segT = scaled - segIndex;

    const rgbA = hexToRgb(stops[segIndex]);
    const rgbB = hexToRgb(stops[segIndex + 1]);
    const rgb = [
      lerp(rgbA[0], rgbB[0], segT),
      lerp(rgbA[1], rgbB[1], segT),
      lerp(rgbA[2], rgbB[2], segT),
    ];

    config[code.id] = {
      label: code.title,
      color: rgbToHex(rgb),
    };
    return config;
  }, {} as ChartConfig);

  const chartData = axialCodes.map((code) => ({
    id: code.id,
    title: code.title,
    value: code.connections?.length ?? 0,
    fill: `var(--color-${code.id})`,
  }));

  if (chartData.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <h2 className="text-xl font-semibold">Axial-code distribution</h2>
      <Card data-chart="axial-code-distribution" className="flex flex-col">
        <ChartStyle id="axial-code-distribution" config={chartConfig} />
        <CardHeader className="flex-row items-start space-y-0 pb-0">
          <Select value={activeCode} onValueChange={setActiveCode}>
            <SelectTrigger
              className="ml-auto h-7 w-[200px] rounded-lg pl-2.5"
              aria-label="Select a value"
            >
              <SelectValue placeholder="Select axial-code" />
            </SelectTrigger>
            <SelectContent align="end" className="rounded-xl">
              {codes.map((key) => {
                const config = chartConfig[key as keyof typeof chartConfig];

                if (!config) {
                  return null;
                }

                return (
                  <SelectItem
                    key={key}
                    value={key}
                    className="rounded-lg [&_span]:flex"
                  >
                    <div className="flex items-center gap-2 text-xs">
                      <span
                        className="flex h-3 w-3 shrink-0 rounded-xs"
                        style={{
                          backgroundColor: config.color,
                        }}
                      />
                      {config?.label}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="flex flex-1 justify-center pb-0">
          <ChartContainer
            id="axial-code-distribution"
            config={chartConfig}
            className="mx-auto aspect-square w-full max-w-[300px]"
          >
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
                shape={renderPieShape}
              >
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          <tspan
                            x={viewBox.cx}
                            y={viewBox.cy}
                            className="fill-foreground text-xl font-bold"
                          >
                            {axialCodes[
                              activeIndex
                            ].connections.length.toLocaleString()}
                            /
                            {axialCodes.reduce(
                              (a, b) => a + b.connections.length,
                              0,
                            )}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 24}
                            className="fill-muted-foreground"
                          >
                            Trace
                            {axialCodes[activeIndex].connections.length !== 1 &&
                              "s"}
                          </tspan>
                        </text>
                      );
                    }
                  }}
                />
              </Pie>
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
