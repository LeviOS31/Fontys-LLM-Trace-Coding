import { create } from "zustand";
import { AxialCode } from "@/lib/types";

interface AxialState {
  axialCodes: AxialCode[] | null;
  setAxialCodes: (axialCodes: AxialCode[]) => void;
  selectedAxialCodeId: string | undefined;
  setSelectedAxialCodeId: (selectedAxialCode: string) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

export const useAxialStore = create<AxialState>()((set) => ({
  axialCodes: null,
  setAxialCodes: (axialCodes: AxialCode[]) => {
    set(() => ({ axialCodes, selectedAxialCodeId: undefined }));
  },
  selectedAxialCodeId: undefined,
  setSelectedAxialCodeId: (selectedAxialCodeId: string) =>
    set(() => ({ selectedAxialCodeId })),
  loading: false,
  setLoading: (loading: boolean) => set(() => ({ loading })),
}));
