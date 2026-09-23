"use client";

import { useSyncExternalStore } from "react";

// 같은 키를 쓰는 컴포넌트끼리 바로 동기화되도록 키별 구독자를 둔다
const listeners = new Map<string, Set<() => void>>();
const memory = new Map<string, boolean>(); // localStorage 를 못 쓸 때 대신 쓰는 값

function read(key: string, fallback: boolean): boolean {
  try {
    const value = localStorage.getItem(key);
    return value === null ? (memory.get(key) ?? fallback) : value === "1";
  } catch {
    return memory.get(key) ?? fallback;
  }
}

function write(key: string, value: boolean) {
  memory.set(key, value);
  try {
    localStorage.setItem(key, value ? "1" : "0");
  } catch {}
  listeners.get(key)?.forEach((listener) => listener());
}

/** 브라우저에 기억하는 켜짐/꺼짐 값. 서버 렌더링에서는 fallback. */
export function useStoredFlag(key: string, fallback = false): [boolean, (value: boolean) => void] {
  const value = useSyncExternalStore(
    (listener) => {
      if (!listeners.has(key)) listeners.set(key, new Set());
      listeners.get(key)!.add(listener);
      return () => listeners.get(key)?.delete(listener);
    },
    () => read(key, fallback),
    () => fallback,
  );
  return [value, (next) => write(key, next)];
}
