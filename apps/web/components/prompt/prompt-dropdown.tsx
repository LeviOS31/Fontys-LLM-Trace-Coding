"use client";
import { PromptType } from "@/lib/enum";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter, useSearchParams } from "next/navigation";

export default function PromptDropdown() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentType =
    searchParams.get("type") || PromptType.AXIAL_CODE_GENERATION_SYSTEM;

  const handleTypeChange = (newType: string) => {
    router.push(`/prompts?type=${newType}`);
  };

  return (
    <Select value={currentType} onValueChange={handleTypeChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Selecteer een prompt" />
      </SelectTrigger>
      <SelectContent>
        {Object.values(PromptType).map((type) => (
          <SelectItem key={type} value={type}>
            {type.replace(/_/g, " ")}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
