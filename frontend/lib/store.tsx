'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { api, connectWallet, disconnectWallet, getConnectedAddress } from './genlayer';
import type { Summary, ConceptKernel } from './types';

interface StoreState {
  summary: Summary | null;
  concepts: ConceptKernel[];
  loading: boolean;
  error: string | null;
  wallet: string | null;
  reducedMotion: boolean;
  setReducedMotion: (v: boolean) => void;
  refresh: () => Promise<void>;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const Ctx = createContext<StoreState | null>(null);

export function useStore(): StoreState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [concepts, setConcepts] = useState<ConceptKernel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wallet, setWallet] = useState<string | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const polling = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const s = await api.getSummary();
      setSummary(s);
      const page = await api.getConceptsPage(0, 20);
      setConcepts(page.items);
    } catch (e: any) {
      setError(e?.message || 'Failed to read the contract.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    // Slow polling: Bradbury rate-limits view reads.
    polling.current = setInterval(refresh, 90000);
    return () => {
      if (polling.current) clearInterval(polling.current);
    };
  }, [refresh]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem('cb-reduced-motion');
      if (stored === '1') setReducedMotion(true);
      const existing = getConnectedAddress();
      if (existing) setWallet(existing);
    }
  }, []);

  const connect = useCallback(async () => {
    const addr = await connectWallet();
    setWallet(addr);
  }, []);

  const disconnect = useCallback(() => {
    disconnectWallet();
    setWallet(null);
  }, []);

  const setRM = useCallback((v: boolean) => {
    setReducedMotion(v);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('cb-reduced-motion', v ? '1' : '0');
    }
  }, []);

  return (
    <Ctx.Provider
      value={{
        summary,
        concepts,
        loading,
        error,
        wallet,
        reducedMotion,
        setReducedMotion: setRM,
        refresh,
        connect,
        disconnect,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}
