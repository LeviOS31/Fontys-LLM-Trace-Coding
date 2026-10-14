import type { AxialCodeChangeKind } from '../../../shared/util/compareAxialCodes.ts';

type BadgeColor = 'gray' | 'blue' | 'amber' | 'green' | 'purple' | 'cyan' | 'red';

export const CHANGE_KIND_META: Record<
  AxialCodeChangeKind | 'removed',
  { readonly label: string; readonly color: BadgeColor }
> = {
  new: { label: 'New', color: 'green' },
  renamed: { label: 'Renamed', color: 'blue' },
  changed: { label: 'Changed', color: 'amber' },
  merged: { label: 'Merged', color: 'purple' },
  split: { label: 'Split', color: 'cyan' },
  removed: { label: 'Removed', color: 'red' },
  unchanged: { label: 'Unchanged', color: 'gray' },
};
