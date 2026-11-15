"use client";

import { useCallback, useEffect, useState } from "react";

export type Repeat = "once" | "weekly" | "monthly";
export type CustomEvent = { id: string; title: string; kind: "event" | "chore"; date: string; owner: string; repeat: Repeat };
export type HomeInfo = { id: string; label: string; note: string };

// Data is stored only on this browser and is never sent to other roommates.
export function useBrowserItems<T>(key: string) {
  const [items, setItems] = useState<T[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [loadFailed, setLoadFailed] = useState(false);
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(key);
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (!Array.isArray(parsed)) throw new Error("Invalid saved data");
        setItems(parsed as T[]);
      }
    } catch {
      setLoadFailed(true);
      setError("Saved entries could not be loaded. Check browser storage before making changes.");
    } finally { setReady(true); }
    const sync = (event: Event) => {
      if (event instanceof CustomEvent && event.detail?.key === key && Array.isArray(event.detail.items)) setItems(event.detail.items as T[]);
      if (event instanceof StorageEvent && event.key === key && event.newValue) {
        try { const parsed: unknown = JSON.parse(event.newValue); if (Array.isArray(parsed)) setItems(parsed as T[]); } catch { setError("Saved entries could not be loaded."); }
      }
    };
    window.addEventListener("goodhouse-data-updated", sync);
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener("goodhouse-data-updated", sync); window.removeEventListener("storage", sync); };
  }, [key]);
  const save = useCallback((next: T[]) => {
    if (loadFailed) return false;
    try {
      window.localStorage.setItem(key, JSON.stringify(next));
      setItems(next); window.dispatchEvent(new CustomEvent("goodhouse-data-updated", { detail: { key, items: next } })); setError(""); return true;
    } catch {
      setError("Could not save on this browser. Check browser storage and try again."); return false;
    }
  }, [key, loadFailed]);
  return { items, ready, error, save };
}
export function newId() { return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`; }
