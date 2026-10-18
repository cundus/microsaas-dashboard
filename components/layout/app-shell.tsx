"use client";

import { useSyncExternalStore } from "react";
import { Header } from "./header";
import { Sidebar } from "./sidebar";

const storageKey = "microsaas:sidebar-collapsed";
const changeEvent = "microsaas:sidebar-change";
let fallbackCollapsed: boolean | undefined;

function readCollapsed() {
  if (fallbackCollapsed !== undefined) return fallbackCollapsed;
  try {
    return window.localStorage.getItem(storageKey) === "true";
  } catch {
    return false;
  }
}

function subscribe(callback: () => void) {
  const sync = () => {
    fallbackCollapsed = undefined;
    callback();
  };
  window.addEventListener("storage", sync);
  window.addEventListener(changeEvent, callback);
  return () => {
    window.removeEventListener("storage", sync);
    window.removeEventListener(changeEvent, callback);
  };
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const collapsed = useSyncExternalStore(subscribe, readCollapsed, () => false);
  const toggle = () => {
    fallbackCollapsed = !collapsed;
    try {
      window.localStorage.setItem(storageKey, String(fallbackCollapsed));
      fallbackCollapsed = undefined;
    } catch {
      // Keep the toggle usable when the browser blocks persistent storage.
    }
    window.dispatchEvent(new Event(changeEvent));
  };
  return (
    <div className="flex min-h-dvh">
      <a
        href="#main-content"
        className="sr-only fixed top-3 left-3 z-50 rounded-control bg-primary p-3 text-primary-foreground focus:not-sr-only"
      >
        Lewati ke konten
      </a>
      <Sidebar collapsed={collapsed} />
      <div className="min-w-0 flex-1">
        <Header collapsed={collapsed} onToggle={toggle} />
        <main
          id="main-content"
          tabIndex={-1}
          className="min-w-0 p-8 outline-none"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
