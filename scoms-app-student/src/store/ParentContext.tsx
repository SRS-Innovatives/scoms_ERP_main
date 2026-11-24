/**
 * Parent mode. For a PARENT login this loads the linked children (GET /parent/children —
 * /auth/me doesn't return them, so this survives an app restart), remembers which child
 * is active, and sends it on every request as X-Active-Student-Id (the backend verifies
 * the link). Switching child drops all cached child data so no screen ever shows one
 * child's numbers under another child's name.
 *
 * For a STUDENT login this is inert: isParent=false and no header is sent.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './AuthContext';
import { setActiveStudentId } from '../services/api/client';
import { fetchMyChildren, LinkedChild } from '../modules/parent/services/parentService';

/** Queries that don't depend on which child is active — kept across a switch. */
const CHILD_INDEPENDENT = new Set(['appModules', 'parentChildren', 'parentProfile']);

const storageKey = (userId: string) => `scoms.parent.activeChild.${userId}`;

export type ParentStatus =
  | 'not-parent' // student login (or logged out)
  | 'loading' // fetching children / stored choice
  | 'no-children' // parent account with no linked student
  | 'needs-choice' // 2+ children and none chosen yet
  | 'ready'
  | 'error';

interface ParentContextValue {
  isParent: boolean;
  status: ParentStatus;
  children: LinkedChild[];
  activeChild: LinkedChild | null;
  selectChild: (id: string) => Promise<void>;
  /** Opens/closes the child switcher sheet (rendered once in RootNavigator). */
  switcherOpen: boolean;
  openSwitcher: () => void;
  closeSwitcher: () => void;
  reloadChildren: () => void;
}

const ParentContext = createContext<ParentContextValue | undefined>(undefined);

export function ParentProvider({ children: node }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isParent = user?.role === 'PARENT';

  const [activeId, setActiveId] = useState<string | null>(null);
  const [restored, setRestored] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);

  const childrenQuery = useQuery({
    queryKey: ['parentChildren', user?.id],
    queryFn: fetchMyChildren,
    enabled: isParent,
    staleTime: 5 * 60_000,
    retry: (count, err: any) => err?.response?.status !== 403 && count < 1,
  });
  const linked = useMemo(() => childrenQuery.data ?? [], [childrenQuery.data]);

  // Restore the last chosen child for this parent account. Keyed on the user id, not
  // the user object — refreshUser() replaces the object and must not reset parent mode.
  const userId = user?.id ?? null;
  useEffect(() => {
    let cancelled = false;
    setRestored(false);
    setActiveId(null);
    setActiveStudentId(null);
    if (!isParent || !userId) {
      setRestored(true);
      return;
    }
    AsyncStorage.getItem(storageKey(userId))
      .catch(() => null)
      .then((stored) => {
        if (cancelled) return;
        if (stored) {
          setActiveStudentId(stored);
          setActiveId(stored);
        }
        setRestored(true);
      });
    return () => {
      cancelled = true;
    };
  }, [isParent, userId]);

  // Once children are known: drop a stale stored choice; auto-pick the only child
  useEffect(() => {
    if (!isParent || !restored || !childrenQuery.data) return;
    const ids = linked.map((c) => c.id);
    if (activeId && ids.includes(activeId)) return;
    const next = ids.length === 1 ? ids[0] : null;
    setActiveStudentId(next);
    setActiveId(next);
  }, [isParent, restored, childrenQuery.data, linked, activeId]);

  const selectChild = useCallback(
    async (id: string) => {
      if (!user || id === activeId) {
        setSwitcherOpen(false);
        return;
      }
      // Header first, so nothing refetches with the previous child's id
      setActiveStudentId(id);
      setActiveId(id);
      setSwitcherOpen(false);
      queryClient.removeQueries({ predicate: (q) => !CHILD_INDEPENDENT.has(String(q.queryKey[0])) });
      await AsyncStorage.setItem(storageKey(user.id), id).catch(() => {});
    },
    [user, activeId, queryClient],
  );

  const status: ParentStatus = useMemo(() => {
    if (!isParent) return 'not-parent';
    if (childrenQuery.isError) {
      // resolveActiveChild answers 403 when the account has no linked student
      return (childrenQuery.error as any)?.response?.status === 403 ? 'no-children' : 'error';
    }
    if (!restored || childrenQuery.isLoading) return 'loading';
    if (linked.length === 0) return 'no-children';
    const active = linked.find((c) => c.id === activeId);
    return active ? 'ready' : 'needs-choice';
  }, [isParent, childrenQuery.isError, childrenQuery.error, childrenQuery.isLoading, restored, linked, activeId]);

  const value = useMemo<ParentContextValue>(
    () => ({
      isParent,
      status,
      children: linked,
      activeChild: linked.find((c) => c.id === activeId) ?? null,
      selectChild,
      switcherOpen,
      openSwitcher: () => setSwitcherOpen(true),
      closeSwitcher: () => setSwitcherOpen(false),
      reloadChildren: () => {
        childrenQuery.refetch();
      },
    }),
    [isParent, status, linked, activeId, selectChild, switcherOpen, childrenQuery],
  );

  return <ParentContext.Provider value={value}>{node}</ParentContext.Provider>;
}

export function useParent(): ParentContextValue {
  const ctx = useContext(ParentContext);
  if (!ctx) throw new Error('useParent must be used within ParentProvider');
  return ctx;
}
