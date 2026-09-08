import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CircleAlert } from "lucide-react";

interface Props {
  overwriteAction: () => void;
}
export default function OverwriteJobDialog({overwriteAction}: Props) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          className={`mx-8 my-4`}
        >
          <CircleAlert/>
          Generate
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Overwrite current job?
          </DialogTitle>
        </DialogHeader>
        <p>Are you sure you want to cancel the current job and start a new one?</p>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant={"outline"}>
              Keep job running
            </Button>
          </DialogClose>
          <Button variant={"destructive"} onClick={() => overwriteAction()}>
            Cancel Job
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}