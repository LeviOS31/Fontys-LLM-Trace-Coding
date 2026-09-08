import ClientLayout from "./layout.client";

export default async function Layout({
  children,
}: {
  params: Promise<{ traceListId: string }>;
  children: React.ReactNode;
}) {
  return (
    <>
      <ClientLayout>{children}</ClientLayout>
    </>
  );
}
