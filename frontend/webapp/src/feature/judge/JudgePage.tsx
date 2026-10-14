import { useParams } from 'react-router';
import { useEffect, useState } from 'react';
import { BASE_URL } from '../../shared/api/api';
import styles from './JudgePage.module.css';
import JudgePageTemplateSelect from './Components/JudgeTemplateSelect';
import type { JudgeTemplate } from '../../shared/types/judgeTemplate';
import { useForm, FormProvider } from 'react-hook-form';

type PageParams = { id: string; versionId: string };
type Status = 'idle' | 'success' | 'error';
type View = 'formatted' | 'raw';

// type JudgeTemplate = {
//   id: string;
//   axialCodeId: string;
//   name: string;
//   isDeprecated: boolean;
// };

type JudgeResult = {
  traceId: string;
  status: string;
  verdict: string;
  reasoning: string;
  error: string | null;
};
type JudgeResponse = { judgeRunId: string; results: JudgeResult[] };

const isJudgeResponse = (value: unknown): value is JudgeResponse => {
  const obj = value as JudgeResponse | null;
  return !!obj && typeof obj === 'object' && Array.isArray(obj.results);
};

export default function JudgePage() {
  const { id: projectId, versionId } = useParams<PageParams>();

  const [templates, setTemplates] = useState<JudgeTemplate[]>([]);
  const [templateId] = useState('');

  const [loading, setLoading] = useState(false);
  const [raw, setRaw] = useState<string | null>(null);
  const [parsed, setParsed] = useState<JudgeResponse | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [view, setView] = useState<View>('formatted');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!projectId || !versionId) return;
    fetch(new URL(`/v1/projects/${projectId}/versions/${versionId}/judge-templates`, BASE_URL))
      .then((r) => r.json())
      .then((d: { judgeTemplates: JudgeTemplate[] }) =>
        setTemplates(d.judgeTemplates.filter((t) => !t.isDeprecated))
      );
  }, [projectId, versionId]);

  const runJudge = async () => {
    setLoading(true);
    setRaw(null);
    setParsed(null);
    setStatus('idle');
    setView('formatted');
    try {
      const url = new URL(
        `/v1/projects/${projectId}/versions/${versionId}/axial-codes/${axialCodeId}/judge`,
        BASE_URL
      );
      const res = await fetch(url.toString(), { method: 'POST' });
      const data = await res.json();
      setRaw(JSON.stringify(data, null, 2));
      setParsed(res.ok && isJudgeResponse(data) ? data : null);
      setStatus(res.ok ? 'success' : 'error');
    } catch (err) {
      setRaw(String(err));
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const copyResult = async () => {
    if (!raw) return;
    try {
      await navigator.clipboard.writeText(raw);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Ignore clipboard unavailable error
    }
  };
  const methods = useForm({ defaultValues: { templateId: '' } });

  const templateIdwatch = methods.watch('templateId');
  const axialCodeId = templates.find((t) => t.id === templateIdwatch)?.axialCodeId ?? '';

  const canRun = !loading && axialCodeId.trim().length > 0;
  const canFormat = parsed !== null;
  const showFormatted = canFormat && view === 'formatted';



  return (
    <main className={styles.root}>
      <header className={styles.header}>
        <h1>Judge</h1>
        <p>Run the judge on a single axial code and inspect the raw response.</p>
      </header>

      <section className={styles.card}>
        <dl className={styles.context}>
          <div>
            <dt>Project</dt>
            <dd>{projectId ?? '–'}</dd>
          </div>
          <div>
            <dt>Version</dt>
            <dd>{versionId ?? '–'}</dd>
          </div>
        </dl>

        <FormProvider {...methods}>
          <form
            className={styles.form}
            onSubmit={(e) => {
              e.preventDefault();
              if (canRun) runJudge();
            }}
          >
            <div className={styles.row}>
              <JudgePageTemplateSelect
                templates={templates}
              />
            </div>
            <button className={styles.submit} type="submit" disabled={!canRun}>
              {loading && <span className={styles.spinner} aria-hidden />}
              {loading ? 'Running judge' : 'Run judge'}
            </button>
          </form>
        </FormProvider>
      </section>

      <section aria-live="polite">
        {raw && (
          <div
            className={`${styles.result} ${status === 'error' ? styles.resultError : ''}`}
          >
            <div className={styles.resultBar}>
              <span>{status === 'error' ? 'Request failed' : 'Response'}</span>
              <div className={styles.actions}>
                {canFormat && (
                  <div className={styles.toggle} role="group" aria-label="Response view">
                    <button
                      type="button"
                      aria-pressed={view === 'formatted'}
                      className={view === 'formatted' ? styles.toggleActive : ''}
                      onClick={() => setView('formatted')}
                    >
                      Formatted
                    </button>
                    <button
                      type="button"
                      aria-pressed={view === 'raw'}
                      className={view === 'raw' ? styles.toggleActive : ''}
                      onClick={() => setView('raw')}
                    >
                      JSON
                    </button>
                  </div>
                )}
                <button type="button" className={styles.copyButton} onClick={copyResult}>
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            {showFormatted && parsed ? (
              <>
                <div className={styles.runMeta}>
                  <div>
                    <span className={styles.metaLabel}>Run ID</span>
                    <code>{parsed.judgeRunId}</code>
                  </div>
                  <span className={styles.metaCount}>
                    {parsed.results.length}{' '}
                    {parsed.results.length === 1 ? 'result' : 'results'}
                  </span>
                </div>

                {parsed.results.length === 0 ? (
                  <p className={styles.empty}>The judge returned no results for this axial code.</p>
                ) : (
                  <ul className={styles.items}>
                    {parsed.results.map((r) => {
                      const verdictTrue = String(r.verdict).toLowerCase() === 'true';
                      const ok = String(r.status).toLowerCase() === 'success';
                      return (
                        <li key={r.traceId} className={styles.item}>
                          <div className={styles.itemHead}>
                            <div>
                              <span className={styles.metaLabel}>Trace</span>
                              <code>{r.traceId}</code>
                            </div>
                            <div className={styles.badges}>
                              <span
                                className={`${styles.badge} ${
                                  verdictTrue ? styles.badgeTrue : styles.badgeFalse
                                }`}
                              >
                                Verdict: {String(r.verdict)}
                              </span>
                              <span
                                className={`${styles.badge} ${
                                  ok ? styles.badgeOk : styles.badgeFail
                                }`}
                              >
                                {r.status}
                              </span>
                            </div>
                          </div>
                          <p className={styles.reasoning}>{r.reasoning}</p>
                          {r.error && <p className={styles.itemError}>{r.error}</p>}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </>
            ) : (
              <pre>{raw}</pre>
            )}
          </div>
        )}
      </section>
    </main>
  );
}