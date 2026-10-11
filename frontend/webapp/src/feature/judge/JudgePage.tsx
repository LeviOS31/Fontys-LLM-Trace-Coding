import { useParams } from 'react-router';
import { useState } from 'react';
import { BASE_URL } from '../../shared/api/api';


type PageParams = { id: string; versionId: string };

export default function JudgePage() {
  const { id: projectId, versionId } = useParams<PageParams>();
  const [axialCodeId, setAxialCodeId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const runJudge = async () => {
    setLoading(true);
    setResult(null);
    try {
      const url = new URL(
        `/v1/projects/${projectId}/versions/${versionId}/axial-codes/${axialCodeId}/judge`,
        BASE_URL
      );
      const res = await fetch(url.toString(), { method: 'POST' });
      const data = await res.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (err) {
      setResult(String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>Judge (test)</h2>
      <input
        placeholder="Axial Code Id"
        value={axialCodeId}
        onChange={(e) => setAxialCodeId(e.target.value)}
        style={{ width: 320, marginRight: 8 }}
      />
      <button onClick={runJudge} disabled={loading || !axialCodeId}>
        {loading ? 'Running...' : 'Run Judge'}
      </button>
      {result && <pre style={{ whiteSpace: 'pre-wrap', marginTop: 16 }}>{result}</pre>}
    </div>
  );
}