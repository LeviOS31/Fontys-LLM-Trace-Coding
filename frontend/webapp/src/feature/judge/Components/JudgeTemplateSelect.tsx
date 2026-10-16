import type { JudgeTemplate } from '../../../shared/types/judgeTemplate';
import { Flex, Text } from '@radix-ui/themes';

type Props = {
    templates: JudgeTemplate[];
    onChange: (updatedIds: string[]) => void;
} 


export default function JudgeTemplateSelect({
    templates,
    onChange,
}: Props) {


    const selectedTemplateIds : string[] = [];
    const allSelected = templates.length > 0 && templates.every(t => selectedTemplateIds.includes(t.id));

    function selecttemplates(checked: boolean, templateId: string) {
        if(checked){
            selectedTemplateIds.push(templateId);
            onChange(selectedTemplateIds);
        }
        else{
            const index = selectedTemplateIds.indexOf(templateId);
            if (index !== -1){
                selectedTemplateIds.splice(index, 1);
                onChange(selectedTemplateIds);
            }
        }

        const allCheckbox = document.querySelectorAll<HTMLInputElement>('.allTemplates');
        allCheckbox?.forEach((checkbox) => {
            checkbox.checked = allSelected;
        });
    }
    
    function selectAllTemplates(checked: boolean) {
        const allCheckboxes = document.querySelectorAll<HTMLInputElement>('.templateCheckbox');
        allCheckboxes.forEach((checkbox) => {
            if(checkbox.checked !== checked){
                checkbox.checked = checked;
                selecttemplates(checked, checkbox.value);
            }
        });
    }
    
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
                <input className="allTemplates" type="checkbox" value="all" style={{flexGrow: 0, minWidth: '16px', minHeight: '16px'}} onChange={(e) => selectAllTemplates(e.target.checked)} />
            </div>
            <div
                style={{
                    overflow: 'scroll',
                    maxHeight: '100px',
                }}
            >
                {templates.map((t, index) => (
                    <div
                        style={{
                            padding: 'var(--space-2)',
                            background: index % 2 === 0 ? '#eaeaea' : 'var(--color-background)',
                            display: 'flex',
                            justifyContent: 'space-between',
                        }}
                    >
                        <p style={{margin: 0, flexGrow: 0}}>
                            {t.name}
                        </p>
                        <input className="templateCheckbox" type="checkbox" value={t.id} style={{flexGrow: 0, minWidth: '16px'}} onChange={(e) => selecttemplates(e.target.checked, t.id)} />
                    </div>
                ))}
            </div>
        </div>
    </Flex>
    );
}