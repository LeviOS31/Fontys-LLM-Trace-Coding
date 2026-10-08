import { Badge } from '@radix-ui/themes';
import type { AxialCodeChangeKind } from '../../../shared/util/compareAxialCodes.ts';
import { CHANGE_KIND_META } from './changeKindMeta.ts';

interface ChangeKindBadgeProps {
  readonly kind: AxialCodeChangeKind | 'removed';
  readonly count?: number;
}

export default function ChangeKindBadge({ kind, count }: ChangeKindBadgeProps) {
  const { label, color } = CHANGE_KIND_META[kind];
  return (
    <Badge color={color} variant="soft" radius="full" size="1" data-testid="axial-code-change">
      {count === undefined ? label : `${count} ${label.toLowerCase()}`}
    </Badge>
  );
}
