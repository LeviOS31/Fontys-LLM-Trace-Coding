import type { JudgeTemplate } from '../../../shared/types/judgeTemplate';
import { useFormContext } from 'react-hook-form';
import { Flex, Text } from '@radix-ui/themes';

type Props = {
    templates: JudgeTemplate[];
} 

export default function JudgeTemplateSelect({
    templates
}: Props) {

    //const [templates] = useState<JudgeTemplateparams['templates']>([]);

    const {register} = useFormContext<{templateIds: string[]}>();

    return (
    <Flex 
        align="end" 
        gap="2"
        style={{width: '100%'}}
        direction="column"
    >
        <div
            style={{
            width: '50%',
            textAlign: 'center',
            }} 
        >
            <Text size="5" weight="bold">
                Judge templates:
            </Text>
        </div>
        <div
            style={{
                width: '50%',
                background: 'var(--color-background)',
                borderRadius: 'var(--radius-6)',
                overflow: 'hidden',
            }}
        >
            <div 
                style={{
                display: 'flex',
                justifyContent: 'flex-end',
                padding: 'var(--space-2)',
                }}
            >
                <p style={{margin: 0, paddingRight: 'var(--space-2)'}}>Select all</p>
                <input disabled type="checkbox" {...register('templateIds')} value="all" style={{flexGrow: 0, minWidth: '16px', minHeight: '16px'}} />
            </div>
            {templates.map((t, index) => (
                <div
                    style={{
                        padding: 'var(--space-2)',
                        background: index % 2 === 0 ? '#CBD5E1' : 'var(--color-background)',
                        display: 'flex',
                        justifyContent: 'space-between',
                    }}
                >
                    <p style={{margin: 0, flexGrow: 0}}>
                        {t.name}
                    </p>
                    <input type="checkbox" {...register('templateIds')} value={t.id} style={{flexGrow: 0, minWidth: '16px'}} />
                </div>
            ))}
        </div>
    </Flex>
    );
}