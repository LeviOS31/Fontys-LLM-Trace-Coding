import { Flex } from '@radix-ui/themes';
import { Navigate, useParams } from 'react-router';
import styles from '../judge/JudgePage.module.css';
import { useGetRawLLMOutputById } from './hooks/useGetRawLLMOutputById.ts';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';



type rawllmoutputparams = {
    id: string;
    versionId: string;
    rawllmoutputId: string;
}

export default function RawLLMOutputPage() {

    const { id, versionId, rawllmoutputId } = useParams<rawllmoutputparams>();

    if (!versionId) return <Navigate to="/404" replace />;
    if (!id) return <Navigate to="/404" replace />;
    if (!rawllmoutputId) return <Navigate to="/404" replace />;

    const { data: rawLLMOutput, isLoading: isRawLLMOutputsLoading }
     = useGetRawLLMOutputById(id, versionId, rawllmoutputId);

    return (
    <main className={styles.root}>
      <header className={styles.header}>
        <h1>Raw LLM Output</h1>
      </header>
        <Flex direction="column" gap="2">
            {isRawLLMOutputsLoading ? (
                <p>Loading...</p>
            ) : rawLLMOutput ? ( 
                <div 
                    className={styles.card}
                    style={{
                        backgroundColor: 'transparent',
                        border: '1px solid var(--gray-6)',
                        padding: '0px',
                    }}
                >
                    <p
                        style={{
                            paddingLeft: '10px',
                            marginTop: '10px',
                            marginBottom: '10px',
                        }}
                    >{rawLLMOutput.name}</p>
                    <div
                        style={{
                            border: '1px solid var(--gray-6)',
                            width: '100%',
                        }}
                    ></div>
                    <SyntaxHighlighter language="json"
                        customStyle={{
                            margin: '0px',
                        }}
                    >
                        {rawLLMOutput.output}
                    </SyntaxHighlighter>
                </div>
            ) : (
                <p>No raw LLM output found.</p>
            )}
        </Flex>
    </main>
    );
}