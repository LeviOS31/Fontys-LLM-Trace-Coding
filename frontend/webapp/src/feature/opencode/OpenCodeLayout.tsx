import { Box, Flex } from '@radix-ui/themes';
import { Navigate, Outlet, useParams } from 'react-router';
import { Group as ResizableGroup, Panel as ResizablePanel } from 'react-resizable-panels';
import CustomResizeHandle from '../../shared/components/CustomResizeHandle';
import TraceSidebar from './components/TraceSidebar/TraceSidebar.tsx';

type OpenCodeLayoutParams = {
  id: string;
  versionId: string;
};

/**
 * Shell for the open coding flow: the trace sidebar stays mounted while the
 * detail routes change, so its scroll position, filters and loaded pages are
 * kept when switching between trace groups.
 */
export default function OpenCodeLayout() {
  const { id: projectId, versionId } = useParams<OpenCodeLayoutParams>();

  if (!projectId || !versionId) return <Navigate to="/404" replace />;

  return (
    <Flex style={{ height: '100vh', minHeight: 0 }}>
      <ResizableGroup
        orientation="horizontal"
        style={{ width: '100%', height: '100%', minHeight: 0 }}
      >
        <ResizablePanel defaultSize={150} minSize={15} maxSize={300}>
          <TraceSidebar projectId={projectId} projectVersionId={versionId} />
        </ResizablePanel>

        <CustomResizeHandle />

        <ResizablePanel defaultSize={75} minSize={40}>
          <Box style={{ width: '100%', height: '100%', minWidth: 0, overflow: 'hidden' }}>
            <Outlet />
          </Box>
        </ResizablePanel>
      </ResizableGroup>
    </Flex>
  );
}
