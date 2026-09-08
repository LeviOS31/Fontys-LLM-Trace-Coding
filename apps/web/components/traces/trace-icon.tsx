import {
  Workflow,
  ListChecks,
  Wrench,
  MessageCircle,
  Bot,
  ClipboardCheck,
  Braces,
  MessagesSquare,
} from "lucide-react";

const Icons = {
  workflow: Workflow,
  task: ListChecks,
  tool: Wrench,
  chat: MessageCircle,
  agent: Bot,
  completion: ClipboardCheck,
  conversation: MessagesSquare,
  default: Braces,
};

export default function TraceIcon({
  name,
  className,
}: {
  name?: string | null;
  className?: string;
}) {
  const type = name
    ?.split(".")
    .slice(-1)[0]
    .toLowerCase() as keyof typeof Icons;

  const Icon = Icons[type] || Icons.default;

  return <Icon className={className} />;
}
