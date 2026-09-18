import { Box, Flex, Kbd, Text } from '@radix-ui/themes';
import { ProjectNavItem } from './ProjectNavItem.tsx';
import { VersionRow } from './VersionRow.tsx';
import { CreateVersionItem } from './CreateVersionItem.tsx';
import { colors } from '../../shared/styling/colors.ts';
import type { Version } from '../../shared/types/version.ts';

interface ProjectVersionsNavProps {
  collapsed?: boolean;
  projectId: string;
  projectName: string;
  versions: Version[];
  currentVersionId: string | undefined;
  keyFocusedIndex: number;
}

export function ProjectVersionsNav({
  collapsed = false,
  projectId,
  projectName,
  versions,
  currentVersionId,
  keyFocusedIndex,
}: Readonly<ProjectVersionsNavProps>) {
  return (
    <Box>
      <ProjectNavItem
        collapsed={collapsed}
        projectId={projectId}
        title={projectName}
        shortcut="H"
      />

      {!collapsed && (
        <Flex align="center" justify="between" px="4" mt="3" mb="2">
          <Text size="1" weight="bold" color={colors.theme.radix.gray}>
            Versions
          </Text>
          <Flex gap="1" style={{ opacity: 0.5 }}>
            <Kbd size="1">[</Kbd>
            <Kbd size="1">]</Kbd>
          </Flex>
        </Flex>
      )}

      {versions.map((version, i) => (
        <VersionRow
          key={version.versionId}
          collapsed={collapsed}
          version={version}
          isSelected={currentVersionId === version.versionId}
          isKeyFocused={keyFocusedIndex === i}
          projectId={projectId}
        />
      ))}

      <CreateVersionItem collapsed={collapsed} projectId={projectId} />
    </Box>
  );
}
