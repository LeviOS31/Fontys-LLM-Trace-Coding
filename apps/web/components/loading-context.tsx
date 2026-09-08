"use client";

import {
  createContext,
  FC,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";

type TaskMap = { [key: string]: string | number };

interface LoadingContextProps {
  children: ReactNode;
}

interface PromiseMessage {
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface PromiseMessages {
  loading: PromiseMessage;
  success: PromiseMessage;
  error: PromiseMessage;
}

interface LoadingContextValue {
  wrapPromise: <T>(
    promise: Promise<T>,
    messages: PromiseMessages,
    id: string,
  ) => Promise<T>;
  startLoading: (message: string, id: string) => void;
  stopLoading: (message: string, id: string) => void;
  isLoading: (id: string) => boolean;
}

const LoadingContext = createContext<LoadingContextValue | undefined>(
  undefined,
);

export const LoadingContextProvider: FC<LoadingContextProps> = ({
  children,
}) => {
  const [activeTasks, setActiveTasks] = useState<TaskMap>({});

  const wrapPromise = <T,>(
    promise: Promise<T>,
    messages: PromiseMessages,
    id: string,
  ): Promise<T> => {
    setActiveTasks((prev) => ({ ...prev, [id]: "PROMISE_TASK" }));

    toast.promise(promise, {
      loading: messages.loading.title,
      success: (_) => {
        return {
          message: messages.success.title,
          description: messages.success.description,
          action: messages.success.action,
        };
      },
      error: messages.error.title,
      finally: () => {
        setActiveTasks((prev) => {
          const { [id]: _, ...rest } = prev;
          return rest;
        });
      },
    });

    return promise;
  };

  const startLoading = (message: string, id: string) => {
    if (activeTasks[id]) return;

    const toastId = toast.loading(message);

    setActiveTasks((prev) => ({ ...prev, [id]: toastId }));
  };

  const stopLoading = (message: string, id: string) => {
    setActiveTasks((prev) => {
      const toastId = prev[id];
      if (toastId) {
        toast.success(message, { id: toastId });
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return prev;
    });
  };

  const isLoading = useCallback(
    (id: string): boolean => {
      return !!activeTasks[id];
    },
    [activeTasks],
  );

  const contextValue = useMemo(
    () => ({
      startLoading,
      stopLoading,
      wrapPromise,
      isLoading,
    }),
    [startLoading, stopLoading, wrapPromise, isLoading],
  );

  return (
    <LoadingContext.Provider value={contextValue}>
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoadingContext = (): LoadingContextValue => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error("useLoadingContext must be used within AxialCodesContext");
  }
  return context;
};
