import { Badge } from "@/components/ui/badge";
import { Table } from "lucide-react";
import { AxialCode } from "@/lib/types";

interface Props {
  axialCode: AxialCode;
  onClick: (axialCode: AxialCode) => void;
  selected?: boolean;
}

export default function AxialCodeListItem({
  axialCode,
  onClick,
  selected,
}: Props) {
  return (
    <div
      className={`border-b p-4 cursor-pointer hover:bg-neutral-100 focus:bg-neutral-100 ${selected && "bg-neutral-100"} min-h-20`}
      onClick={() => onClick(axialCode)}
    >
      <h3 data-testid={"axial-title"}>{axialCode.title}</h3>
      <div className="space-x-2">
        <Badge>
          <Table />
          <p data-testid="axial-amount">{axialCode.connections?.length}</p>
        </Badge>
      </div>
    </div>
  );
}
