import { Sidebar } from './Sidebar.tsx';
import { Outlet, useMatch } from 'react-router';
import { Box, Flex } from '@radix-ui/themes';

export function AppLayout() {
  // The open coding flow brings its own sidebar, which has to sit flush against
  // the app navigation and own the full viewport height.
  const isFullBleed = useMatch('/projects/:id/versions/:versionId/open-code/*') !== null;

  return (
    <Flex style={{ minHeight: '100vh' }}>
      <Sidebar />

      <Box
        style={{
          flex: 1,
          minWidth: 0,
          padding: isFullBleed ? 0 : 32,
          height: isFullBleed ? '100vh' : undefined,
          overflow: isFullBleed ? 'hidden' : undefined,
        }}
      >
        <Outlet />
      </Box>
    </Flex>
  );
}
