export function formatTraceDate(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

  if (date >= oneYearAgo) {
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  return date.getFullYear().toString();
}
