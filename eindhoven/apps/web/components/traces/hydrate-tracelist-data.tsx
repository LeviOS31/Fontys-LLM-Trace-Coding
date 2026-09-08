"use client";

import { AxialCode, Tracelist } from "@/lib/types";
import { useTraceStore } from "@/state/trace";
import { useEffect } from "react";
import { useAxialStore } from "@/state/axial";

interface Props {
  axialCodes: AxialCode[];
  traceList: Tracelist;
}

export default function HydrateTracelistData(props: Props) {
  const setTraceList = useTraceStore((s) => s.setTraceList);
  const setAxialCodes = useAxialStore((s) => s.setAxialCodes);

  useEffect(() => {
    setTraceList(props.traceList);
  }, [props.traceList, setTraceList]);

  useEffect(() => {
    setAxialCodes(props.axialCodes);
  }, [props.axialCodes, setAxialCodes]);

  return null;
}
