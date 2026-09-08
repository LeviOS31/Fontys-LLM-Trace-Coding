import {
  Sparkles,
  Database,
  Globe,
  Server,
  Circle,
  Cpu,
  ArrowUpCircle,
  ArrowDownCircle,
  Monitor,
  type LucideIcon,
} from 'lucide-react';
import type { SpanKind, TraceScopeSpanView } from '../../../../shared/types/trace';

export type BadgeColor = 'gray' | 'blue' | 'green' | 'orange' | 'purple' | 'crimson';

export type SpanCategory = {
  label: string;
  color: BadgeColor;
  Icon: LucideIcon;
};

const SPAN_KIND_COLORS: Record<SpanKind, BadgeColor> = {
  Unspecified: 'gray',
  Internal: 'green',
  Server: 'blue',
  Client: 'crimson',
  Producer: 'orange',
  Consumer: 'purple',
};

const SPAN_KIND_ICONS: Record<SpanKind, LucideIcon> = {
  Unspecified: Circle,
  Internal: Cpu,
  Server: Server,
  Client: Monitor,
  Producer: ArrowUpCircle,
  Consumer: ArrowDownCircle,
};

export function getSpanCategory(span: TraceScopeSpanView): SpanCategory {
  const has = (key: string) => span.attributes.some((a) => a.key === key);

  if (has('gen_ai.system')) return { label: 'GenAI', color: 'purple', Icon: Sparkles };
  if (has('db.system')) return { label: 'Database', color: 'blue', Icon: Database };
  if (has('http.method')) return { label: 'HTTP', color: 'orange', Icon: Globe };

  return {
    label: span.spanKind,
    color: SPAN_KIND_COLORS[span.spanKind as SpanKind] ?? 'gray',
    Icon: SPAN_KIND_ICONS[span.spanKind as SpanKind] ?? Circle,
  };
}
