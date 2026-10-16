import { Box, Heading, Text } from '@radix-ui/themes';

export function SectionHead({
  title,
  subtitle,
}: {
  readonly title: string;
  readonly subtitle?: string;
}) {
  return (
    <Box mb="3">
      <Heading size="3" style={{ letterSpacing: '-0.01em' }}>
        {title}
      </Heading>
      {subtitle && (
        <Text as="p" size="2" color="gray" mt="1" style={{ maxWidth: 600 }}>
          {subtitle}
        </Text>
      )}
    </Box>
  );
}

export function SummaryStat({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string | number;
}) {
  return (
    <Box>
      <Text as="p" size="1" color="gray">
        {label}
      </Text>
      <Text as="p" size="5" weight="bold">
        {value}
      </Text>
    </Box>
  );
}
