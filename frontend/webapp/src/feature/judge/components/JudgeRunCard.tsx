import { useState } from 'react';
import { AlertDialog, Badge, Box, Button, Card, Code, Flex, Text } from '@radix-ui/themes';
import { ChevronRight, Trash2 } from 'lucide-react';
import { formatDate, statsFromCounts, type JudgeRunListItem } from '../hooks/judgeUtils';

type Props = {
  readonly run: JudgeRunListItem;
  readonly onSelect: (judgeRunId: string) => void;
  readonly onDelete: (judgeRunId: string) => Promise<boolean>;
};

export default function JudgeRunCard({ run, onSelect, onDelete }: Props) {
  const stats = statsFromCounts(run);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(false);

  const confirmDelete = async () => {
    if (deleting) return;

    setDeleting(true);
    try {
      if (await onDelete(run.judgeRunId)) {
        setDeleteOpen(false);
      } else {
        setDeleteError(true);
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Card>
        <Flex align="center" justify="between" gap="3" wrap="wrap">
          <button
            type="button"
            aria-label={`Open ${run.name ?? 'Judge run'} (${run.judgeRunId})`}
            onClick={() => onSelect(run.judgeRunId)}
            style={{
              flex: '1 1 18rem',
              minWidth: 0,
              textAlign: 'left',
              cursor: 'pointer',
              border: 0,
              padding: 0,
              background: 'transparent',
              color: 'inherit',
            }}
          >
            <Flex align="center" justify="between" gap="4" wrap="wrap">
              <Box style={{ minWidth: 0 }}>
                <Text as="p" size="3" weight="bold">
                  {run.name ?? 'Judge run'}
                </Text>
                <Text as="p" size="1" color="gray" mt="1">
                  {formatDate(run.createdAt)}
                </Text>
                <Code size="1" color="gray" variant="ghost">
                  {run.judgeRunId}
                </Code>
              </Box>

              <Flex align="center" gap="2" wrap="wrap">
                <Badge color="gray" variant="soft" size="2">
                  {stats.total} {stats.total === 1 ? 'result' : 'results'}
                </Badge>
                <Badge color="green" variant="soft" size="2">
                  {stats.trueCount} true
                </Badge>
                <Badge color="red" variant="soft" size="2">
                  {stats.falseCount} false
                </Badge>
                {stats.failedCount > 0 && (
                  <Badge color="orange" variant="soft" size="2">
                    {stats.failedCount} failed
                  </Badge>
                )}
                <ChevronRight size={18} />
              </Flex>
            </Flex>
          </button>
          <Button
            type="button"
            variant="ghost"
            color="red"
            aria-label={`Delete ${run.name ?? 'Judge run'} (${run.judgeRunId})`}
            onClick={() => {
              setDeleteError(false);
              setDeleteOpen(true);
            }}
            style={{ flexShrink: 0, marginLeft: 'auto', whiteSpace: 'nowrap' }}
          >
            <Trash2 size={14} />
            Delete
          </Button>
        </Flex>
      </Card>
      <AlertDialog.Root
        open={deleteOpen}
        onOpenChange={(open) => {
          if (!open && !deleting) {
            setDeleteOpen(false);
            setDeleteError(false);
          }
        }}
      >
        <AlertDialog.Content maxWidth="450px">
          <AlertDialog.Title>Delete judge run?</AlertDialog.Title>
          <AlertDialog.Description size="2">
            This will permanently delete the judge run “{run.name ?? run.judgeRunId}”. This action
            cannot be undone.
          </AlertDialog.Description>
          {deleteError && (
            <Text as="p" size="2" color="red" role="alert" mt="3">
              Could not delete the judge run. Please try again.
            </Text>
          )}
          <Flex gap="3" mt="4" justify="end">
            <AlertDialog.Cancel>
              <Button variant="soft" color="gray" disabled={deleting}>
                Cancel
              </Button>
            </AlertDialog.Cancel>
            <Button
              type="button"
              variant="solid"
              color="red"
              onClick={confirmDelete}
              disabled={deleting}
            >
              Delete run
            </Button>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>
    </>
  );
}
