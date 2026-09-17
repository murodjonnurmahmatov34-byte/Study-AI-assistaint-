"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { IcAlert, IcCheckCircle, IcSparkles } from "./icons";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info";
interface Toast {
  id: number;
  type: ToastType;
  message: string;
  leaving?: boolean;
}

interface ToastCtx {
  push: (type: ToastType, message: string) => void;
}

const Ctx = createContext<ToastCtx>({ push: () => {} });

export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const remove = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const push = useCallback(
    (type: ToastType, message: string) => {
      const id = ++idRef.current;
      setToasts((t) => [...t.slice(-3), { id, type, message }]);
      window.setTimeout(() => remove(id), 4500);
    },
    [remove],
  );

  return (
    <Ctx.Provider value={{ push }}>
      {children}
      <div
        className="pointer-events-none fixed bottom-4 right-4 z-[120] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2"
        role="status"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "toast-in pointer-events-auto flex items-start gap-3 rounded-lg border px-4 py-3 shadow-lg backdrop-blur",
              t.type === "success" && "border-emerald-200 bg-emerald-50/95 text-emerald-900",
              t.type === "error" && "border-red-200 bg-red-50/95 text-red-900",
              t.type === "info" && "border-mist bg-cream/95 text-ink",
            )}
          >
            <span className="mt-0.5 shrink-0">
              {t.type === "success" ? (
                <IcCheckCircle className="h-4 w-4 text-emerald-600" />
              ) : t.type === "error" ? (
                <IcAlert className="h-4 w-4 text-red-600" />
              ) : (
                <IcSparkles className="h-4 w-4 text-brand-600" />
              )}
            </span>
            <p className="text-sm leading-snug">{t.message}</p>
            <button
              onClick={() => remove(t.id)}
              className="ml-auto -mr-1 rounded p-1 opacity-50 transition hover:opacity-100"
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
