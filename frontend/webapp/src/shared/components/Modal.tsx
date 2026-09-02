import { Dialog } from '@radix-ui/themes';
import * as React from 'react';

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  onKeyDown?: React.KeyboardEventHandler<HTMLDivElement>;
}

export default function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  onKeyDown,
}: Readonly<ModalProps>) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content maxWidth="460px" onKeyDown={onKeyDown}>
        <Dialog.Title>{title}</Dialog.Title>
        {description && (
          <Dialog.Description size="2" color="gray" mb="4">
            {description}
          </Dialog.Description>
        )}
        {children}
      </Dialog.Content>
    </Dialog.Root>
  );
}
