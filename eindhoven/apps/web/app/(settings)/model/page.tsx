import { client } from "@/lib/utils";
import ClientPage from "./page.client";

export default async function Page() {
  const { data } = await client.settings.model.get();

  return (
    <>
      <h1 className="text-2xl">Model settings</h1>
      <ClientPage data={data} />
    </>
  );
}
