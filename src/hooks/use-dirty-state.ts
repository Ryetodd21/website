"use client";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Track whether a form's current values differ from a baseline snapshot.
 * Returns `isDirty` (any field changed) and `dirtyFields` (which fields).
 *
 * Usage:
 *   const [values, setValues] = useState(initial);
 *   const { isDirty, dirtyFields, reset } = useDirtyState(values, initial);
 *
 * Round 27 audit (P0): callers pass object literals as `current`, which
 * produce a new reference on every render. The original useEffect had
 * `[current]` as dep and called `setDirtyFields(new Set(...))` with a
 * fresh Set every fire — setState does not bail out on a different
 * reference, so the hook triggered an infinite render loop on every
 * page that called it (students, settings). The fix below compares the
 * new Set against the current state in a ref before calling setState,
 * so identical content short-circuits the update.
 */
export function useDirtyState<T extends Record<string, unknown>>(
  current: T,
  initialBaseline: T,
) {
  let baselineInit: T;
  try {
    baselineInit = structuredClone(initialBaseline);
  } catch {
    baselineInit = { ...initialBaseline };
  }
  const baselineRef = useRef<T>(baselineInit);
  const [isDirty, setIsDirty] = useState(false);
  const [dirtyFields, setDirtyFields] = useState<Set<keyof T>>(new Set());
  // Hold the latest committed dirtyFields in a ref so the effect can
  // compare without making it a useEffect dep (which would re-fire on
  // every state update and cause the same loop).
  const dirtyFieldsRef = useRef<Set<keyof T>>(new Set());
  const isDirtyRef = useRef(false);
  // Round 29: cache the previous `current` object so the effect can
  // short-circuit on referential equality (callers pass fresh literals
  // on every render — without this guard the JSON.stringify in the
  // effect runs for every parent re-render even when the form is idle).
  const currentRef = useRef<T>(current);
  // Round 30 audit (P2): cache the per-key JSON.stringify result so
  // an idle form (no field changes between renders) skips the O(n)
  // stringify work entirely on subsequent re-renders. The strings
  // are recomputed only when `current` changes reference.
  const cachedStringsRef = useRef<Map<keyof T, string> | null>(null);

  useEffect(() => {
    // Round 29 audit P2 (B7): short-circuit when the `current`
    // reference is the same as the previous render. Callers pass
    // object literals on every render, so this hook re-fires on
    // every parent render — the JSON.stringify cost on each field
    // adds up. Cache the previous `current` and skip the effect
    // body entirely if referentially equal. (Inside the effect,
    // the existing `sameKeys` bail-out still handles the case
    // where `current` is a fresh object but produces the same
    // dirty set — that path stays as defense-in-depth.)
    const prevCurrent = currentRef.current;
    if (prevCurrent === current) return;
    currentRef.current = current;

    // Build the string cache once per (current) reference. If all
    // strings match the previous cache, no field changed — bail out
    // before touching React state.
    const baseline = baselineRef.current;
    const newStrings = new Map<keyof T, string>();
    for (const key of Object.keys(current) as Array<keyof T>) {
      newStrings.set(key, JSON.stringify(current[key]));
    }
    const prevStrings = cachedStringsRef.current;
    if (prevStrings) {
      let allUnchanged = true;
      for (const [key, value] of newStrings) {
        if (prevStrings.get(key) !== value) {
          allUnchanged = false;
          break;
        }
      }
      if (allUnchanged && newStrings.size === prevStrings.size) {
        // No field changed since last run — skip the setState calls.
        return;
      }
    }
    cachedStringsRef.current = newStrings;

    const changed = new Set<keyof T>();
    for (const [key, value] of newStrings) {
      if (value !== JSON.stringify(baseline[key])) {
        changed.add(key);
      }
    }
    // Bail out if the new Set has the same keys as the committed one.
    // Both sets are small (form fields), so JSON.stringify round-trip
    // is cheaper than re-rendering the consumer.
    const prevKeys = Array.from(dirtyFieldsRef.current).sort();
    const nextKeys = Array.from(changed).sort();
    const sameKeys =
      prevKeys.length === nextKeys.length &&
      prevKeys.every((k, i) => k === nextKeys[i]);
    if (sameKeys) return;
    dirtyFieldsRef.current = changed;
    isDirtyRef.current = changed.size > 0;
    setDirtyFields(changed);
    setIsDirty(changed.size > 0);
  }, [current]);

  const reset = useCallback(() => {
    let next: T;
    try {
      next = structuredClone(current);
    } catch {
      next = { ...current };
    }
    baselineRef.current = next;
    dirtyFieldsRef.current = new Set();
    isDirtyRef.current = false;
    setDirtyFields(new Set());
    setIsDirty(false);
  }, [current]);

  const accept = useCallback(() => {
    let next: T;
    try {
      next = structuredClone(current);
    } catch {
      next = { ...current };
    }
    baselineRef.current = next;
  }, [current]);

  return { isDirty, dirtyFields, reset, accept };
}