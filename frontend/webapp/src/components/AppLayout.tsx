import { Sidebar } from './Sidebar.tsx';
import { Outlet } from 'react-router';
import { Box, Flex } from '@radix-ui/themes';

export function AppLayout() {
  return (
    <Flex style={{ minHeight: '100vh' }}>
      <Sidebar />

      <Box style={{ flex: 1, minWidth: 0, padding: 32 }}>
        <Outlet />
      </Box>
    </Flex>
  );
}
