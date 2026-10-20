import { useSyncExternalStore, useMemo } from "react";
import { recordSchema, seedRecords, type ChangeOrder } from "./model";
export const STORAGE_KEY = "constructai.records.v1";
const empty: ChangeOrder[] = [];
const subscribe = (callback: () => void) => {
  window.addEventListener("storage", callback);
  window.addEventListener("constructai-update", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("constructai-update", callback);
  };
};
const snapshot = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) || "seed";
  } catch {
    return "unavailable";
  }
};
export function useRecords() {
  const raw = useSyncExternalStore(subscribe, snapshot, () => null);
  return useMemo(() => {
    if (raw === null) return { records: empty, ready: false, error: "" };
    if (raw === "unavailable")
      return {
        records: empty,
        ready: true,
        error:
          "Browser storage is unavailable. Enable local storage to save records.",
      };
    if (raw === "seed")
      return { records: seedRecords(), ready: true, error: "" };
    try {
      return {
        records: recordSchema.array().parse(JSON.parse(raw)),
        ready: true,
        error: "",
      };
    } catch {
      return {
        records: empty,
        ready: true,
        error:
          "Saved browser data could not be read. Export a backup in Settings before resetting the workspace.",
      };
    }
  }, [raw]);
}
export function persistRecords(records: ChangeOrder[]) {
  recordSchema.array().parse(records);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  window.dispatchEvent(new Event("constructai-update"));
}
