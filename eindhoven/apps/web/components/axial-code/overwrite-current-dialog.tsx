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
  handleAction: () => void;
}

export default function OverwriteCurrentDialog({handleAction}: Props) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          className={`mx-8 my-4`}
        >
          <CircleAlert/>
          Regenerate axial codes
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Regenerate axial codes
          </DialogTitle>
        </DialogHeader>
        <p>Are you sure you want to regenerate the axial codes and overwrite te current ones?</p>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant={"outline"}>
              Cancel
            </Button>
          </DialogClose>
          <Button variant={"destructive"} onClick={() => handleAction()}>
            Generate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}