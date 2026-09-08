import HydrateTracelistData from "@/components/traces/hydrate-tracelist-data";
import { client } from "@/lib/utils";
import ErrorMessage from "@/components/error-message";

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ traceListId: string; projectId: string }>;
}) {
  const { traceListId } = await params;

  const { data: axialCodes, error: axialError } = await client
    .axial({ traceListId })
    .get();
  const { data: traceList, error: traceListError } = await client
    .lists({ traceListId })
    .get();
  const { data: traceListInfo, error: traceListInfoError } = await client
    .lists({ traceListId })
    .info.get();

  const errors = [axialError, traceListError, traceListInfoError].filter(
    (x) => x?.value.message != null,
  );
  if (errors.length > 0) {
    return (
      <ErrorMessage messages={errors.map((e) => e?.value.message ?? "")} />
    );
  }

  return (
    <>
      <HydrateTracelistData
        axialCodes={axialCodes ?? []}
        traceList={{
          ...traceListInfo!,
          traces: traceList ?? [],
        }}
      />
      {children}
    </>
  );
}
