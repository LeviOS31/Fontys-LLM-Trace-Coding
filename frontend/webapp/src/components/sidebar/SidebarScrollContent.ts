import { createContext, useContext, type RefObject } from 'react';

export const SidebarScrollContext = createContext<RefObject<HTMLDivElement | null> | null>(null);

export function useSidebarScrollContainer() {
  return useContext(SidebarScrollContext);
}
