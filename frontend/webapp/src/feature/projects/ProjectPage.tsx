import { useParams, Navigate } from 'react-router';
import { useGetProject } from './hooks/useGetProject.ts';
import { ChartSpline } from 'lucide-react';
import ProjectDetailsCard from './components/ProjectDetailsCard.tsx';
import ProjectAnalyticsCard from './components/ProjectAnalyticsCard/ProjectAnalyticsCard.tsx';
import { Text, Flex } from '@radix-ui/themes';

export const ProjectPage = () => {
  const { id } = useParams<{ id: string }>();

  if (!id) return <Navigate to="/404" replace />;

  return <ProjectDetails id={id} />;
};

const ProjectDetails = ({ id }: { id: string }) => {
  const { data, isLoading, error } = useGetProject(id);

  if (error) {
    return <div>Failed to load project.</div>;
  }
  if (!data && !isLoading) {
    return <Navigate to="/404" replace />;
  }

  return (
    <Flex direction="column" gap="3">
      <Flex align="center" justify="between" gap="3">
        <Flex align="center" gap="2">
          <ChartSpline size={20} />
          <Text size="6" weight="bold">
            Project Analytics
          </Text>
        </Flex>
      </Flex>

      <ProjectDetailsCard projectId={id} />

      <ProjectAnalyticsCard projectId={id} />
    </Flex>
  );
};

export default ProjectPage;
