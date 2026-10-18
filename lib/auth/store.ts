import { createStore } from "zustand/vanilla";
import type { Admin } from "./session";

export function createAuthStore(admin: Admin) {
  return createStore<{ admin: Admin | null; clear: () => void }>()((set) => ({
    admin,
    clear: () => set({ admin: null }),
  }));
}
