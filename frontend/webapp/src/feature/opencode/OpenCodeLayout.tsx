import { Box, Flex } from '@radix-ui/themes';
import { Navigate, Outlet, useParams } from 'react-router';
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
      <TraceSidebar projectId={projectId} projectVersionId={versionId} />

      <Box style={{ flex: 1, minWidth: 0, height: '100%', overflow: 'hidden' }}>
        <Outlet />
      </Box>
    </Flex>
  );
}
