import HydratePromptData from "@/components/prompt/hydrate-prompt-data";
import { client } from "@/lib/utils";

export default async function PromptSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data } = await client.prompt.get();

  return (
    <div className={`flex-1`}>
      <HydratePromptData prompts={data ?? []} />
      {children}
    </div>
  );
}
