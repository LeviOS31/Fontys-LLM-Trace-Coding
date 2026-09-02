import { Box, Flex, Grid } from '@radix-ui/themes';
import { Separator as PanelResizeHandle } from 'react-resizable-panels';

export default function CustomResizeHandle() {
  const dots = Array.from({ length: 6 }, (_, i) => `handle-dot-${i}`);

  return (
    <PanelResizeHandle
      style={{
        marginBottom: '-16px',
        position: 'relative',
        width: '1px',
        backgroundColor: 'var(--gray-a5)',
        cursor: 'col-resize',
        outline: 'none',
      }}
    >
      <Flex
        align="center"
        justify="center"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '10px',
          height: '24px',
          backgroundColor: 'var(--gray-2)',
          border: '1px solid var(--gray-a5)',
          borderRadius: '4px',
          pointerEvents: 'none',
        }}
      >
        <Grid columns="2" style={{ gap: '2px' }}>
          {dots.map((dotId) => (
            <Box
              key={dotId}
              style={{
                width: 2,
                height: 2,
                backgroundColor: 'var(--gray-a8)',
                borderRadius: '50%',
              }}
            />
          ))}
        </Grid>
      </Flex>
    </PanelResizeHandle>
  );
}
