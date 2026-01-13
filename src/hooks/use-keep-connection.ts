"use client";

import { useCallback, useEffect, useState } from "react";
import { STORAGE_KEYS } from "@/lib/storage-keys";

export type KeepConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error";

const KEEP_CONNECTION_EVENT = "keep-connection-update";

const normalizeStatus = (value: string | null): KeepConnectionStatus | null => {
  if (
    value === "disconnected" ||
    value === "connecting" ||
    value === "connected" ||
    value === "error"
  ) {
    return value;
  }
  return null;
};

export function useKeepConnection() {
  const [status, setStatus] = useState<KeepConnectionStatus>("disconnected");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const stored = normalizeStatus(
      localStorage.getItem(STORAGE_KEYS.keepApiStatus)
    );
    if (stored) {
      setStatus(stored);
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEYS.keepApiStatus) return;
      const next = normalizeStatus(event.newValue);
      if (next) {
        setStatus(next);
      }
    };

    const handleCustomEvent = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      const next = normalizeStatus(typeof detail === "string" ? detail : null);
      if (next) {
        setStatus(next);
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(KEEP_CONNECTION_EVENT, handleCustomEvent);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(KEEP_CONNECTION_EVENT, handleCustomEvent);
    };
  }, []);

  const updateStatus = useCallback((next: KeepConnectionStatus) => {
    setStatus(next);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.keepApiStatus, next);
      window.dispatchEvent(
        new CustomEvent(KEEP_CONNECTION_EVENT, { detail: next })
      );
    }
  }, []);

  const disconnect = useCallback(() => {
    updateStatus("disconnected");
  }, [updateStatus]);

  return { status, setStatus: updateStatus, disconnect };
}
