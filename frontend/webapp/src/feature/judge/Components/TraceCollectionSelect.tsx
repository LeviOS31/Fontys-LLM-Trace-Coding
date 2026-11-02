import { useEffect, useState } from 'react';
import { BASE_URL } from '../../../shared/api/api';
import styles from '../JudgePage.module.css';

type TraceCollection = { traceCollectionId: string; name: string; tracersCount: number };

type Props = {
  projectId?: string;
  versionId?: string;
  onChange: (ids: string[]) => void;
};

export default function TraceCollectionSelect({ projectId, versionId, onChange }: Props) {
  const [collections, setCollections] = useState<TraceCollection[]>([]);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (!projectId || !versionId) return;
    fetch(new URL(`/v1/projects/${projectId}/versions/${versionId}/traces/collections`, BASE_URL))
      .then((r) => r.json())
      .then((d: { traceCollections?: TraceCollection[] }) => setCollections(d.traceCollections ?? []));
  }, [projectId, versionId]);

  const selectable = collections.filter((c) => c.tracersCount > 0).map((c) => c.traceCollectionId);
  const allSelected = selectable.length > 0 && selectable.every((id) => selected.includes(id));

  const update = (ids: string[]) => {
    setSelected(ids);
    onChange(ids);
  };

  const toggle = (id: string) =>
    update(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

  return (
    <fieldset className={styles.checkList}>
      <legend>Trace collections</legend>

      <label className={styles.checkItem}>
        <input
          type="checkbox"
          checked={allSelected}
          disabled={selectable.length === 0}
          onChange={() => update(allSelected ? [] : selectable)}
        />
        Select all
      </label>

      {collections.map((c) => (
        <label key={c.traceCollectionId} className={styles.checkItem}>
          <input
            type="checkbox"
            checked={selected.includes(c.traceCollectionId)}
            disabled={c.tracersCount === 0}
            onChange={() => toggle(c.traceCollectionId)}
          />
          {c.name} ({c.tracersCount})
        </label>
      ))}
    </fieldset>
  );
}