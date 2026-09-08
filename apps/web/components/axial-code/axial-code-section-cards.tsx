import { Layers, TrendingDown, TrendingUp } from "lucide-react";

import { client } from "@/lib/utils";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function AxialCodeSectionCards({
  traceListId,
}: {
  traceListId: string;
}) {
  const { data } = await client.axial({ traceListId }).statistics.get();

  if (!data) return null;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-between">
            <CardDescription className="flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              Most Actual
            </CardDescription>
            <Badge
              variant="secondary"
              className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 font-medium"
            >
              🔍 Focus First
            </Badge>
          </div>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {data.mostActual.title}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-medium">
              {data.mostActual.count} trace{data.mostActual.count !== 1 && "s"}
            </span>
            <span className="text-muted-foreground">
              ({data.mostActual.percentage})
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Highest frequency problem. Review for consolidation if dominating
            the schema or splitting if too broad.
          </p>
        </CardFooter>
      </Card>
      <Card>
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-between">
            <CardDescription className="flex items-center gap-1.5">
              <TrendingDown className="h-4 w-4 text-amber-600" />
              Least Actual
            </CardDescription>
            <Badge
              variant="secondary"
              className="bg-amber-100 text-amber-800 hover:bg-amber-200 font-medium"
            >
              ⏳ Can Wait
            </Badge>
          </div>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {data.leastActual.title}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-medium">
              {data.leastActual.count} trace
              {data.leastActual.count !== 1 && "s"}
            </span>
            <span className="text-muted-foreground">
              ({data.leastActual.percentage})
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Lowest frequency. Monitor for patterns or merge into broader themes
            during final review.
          </p>
        </CardFooter>
      </Card>
      <Card>
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-between">
            <CardDescription className="flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-blue-600" />
              Code Schema
            </CardDescription>
            <Badge
              variant="secondary"
              className="bg-blue-100 text-blue-800 hover:bg-blue-200 font-medium"
            >
              📊 Overview
            </Badge>
          </div>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {data.schemaStats.uniqueCodes} axial-code
            {data.schemaStats.uniqueCodes !== 1 && "s"}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-medium">
              Avg {data.schemaStats.avgTracesPerCode} trace
              {data.schemaStats.avgTracesPerCode !== 1 && "s"}/code
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Total axial codes used. Too high → fragmented. Too low →
            oversimplified. Aim for balanced granularity.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
