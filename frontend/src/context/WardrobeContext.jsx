import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthContext";
import { wardrobeApi } from "@/services/api";
import { friendlyError } from "@/features/adventure/catalog";
const WardrobeContext = createContext(null);
const EMPTY = { equipped: "school-uniform", shop_unlocked: false, unlock_completed: 0, unlock_total: 3, catalog: [], wallet: { balance: 0 } };

export function WardrobeProvider({ children }) {
  const { user, loading } = useAuth();
  const owner = user?.username || "guest";
  const [saved, setSaved] = useState(null);
  const [busy, setBusy] = useState(false);
  const version = useRef(0);
  const lock = useRef(false);
  // Hide the previous account immediately while fetching this account's inventory.
  const inventory = saved?.owner === owner ? saved.inventory : EMPTY;
  const error = saved?.owner === owner ? saved.error || "" : "";
  const refresh = useCallback(async () => {
    if (loading) return;
    const request = ++version.current;
    try {
      const { data } = await wardrobeApi.get();
      if (request === version.current) setSaved({ owner, inventory: data, error: "" });
    } catch (err) {
      if (request === version.current) setSaved((current) => ({
        owner, inventory: current?.owner === owner ? current.inventory : EMPTY, error: friendlyError(err),
      }));
    }
  }, [owner, loading]);
  useEffect(() => {
    const timer = setTimeout(refresh, 0);
    return () => {
      clearTimeout(timer);
      // Invalidate requests made for the previous account or mount.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      version.current++;
    };
  }, [refresh]);
  const mutate = async (action, id) => {
    if (lock.current || loading) return false;
    lock.current = true;
    setBusy(true);
    const request = ++version.current;
    try {
      const { data } = await wardrobeApi[action](id);
      if (request === version.current) setSaved({ owner, inventory: data, error: "" });
      return request === version.current;
    } catch (err) {
      if (request === version.current) setSaved({ owner, inventory, error: friendlyError(err) });
      return false;
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  return <WardrobeContext.Provider value={{ inventory, busy, error, refresh, equip: (id) => mutate("equip", id), purchase: (id) => mutate("purchase", id) }}>{children}</WardrobeContext.Provider>;
}
// eslint-disable-next-line react-refresh/only-export-components
export function useWardrobe() { return useContext(WardrobeContext); }
