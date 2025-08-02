'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ScrapeTarget, CreateScrapeTargetRequest, UpdateScrapeTargetRequest } from '../types/scrape-targets';

interface ScrapeTargetsContextType {
  targets: ScrapeTarget[];
  loading: boolean;
  error: string | null;
  fetchTargets: () => Promise<void>;
  createTarget: (target: CreateScrapeTargetRequest) => Promise<ScrapeTarget>;
  updateTarget: (target: UpdateScrapeTargetRequest) => Promise<ScrapeTarget>;
  deleteTarget: (id: string) => Promise<void>;
  toggleTargetActive: (id: string) => Promise<void>;
  updateTargetField: (id: string, field: keyof ScrapeTarget, value: any) => Promise<void>;
}

const ScrapeTargetsContext = createContext<ScrapeTargetsContextType | undefined>(undefined);

export function useScrapeTargets() {
  const context = useContext(ScrapeTargetsContext);
  if (context === undefined) {
    throw new Error('useScrapeTargets must be used within a ScrapeTargetsProvider');
  }
  return context;
}

interface ScrapeTargetsProviderProps {
  children: ReactNode;
}

export function ScrapeTargetsProvider({ children }: ScrapeTargetsProviderProps) {
  const [targets, setTargets] = useState<ScrapeTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTargets = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/scrape-targets');

      if (!response.ok) {
        throw new Error(`Failed to fetch scrape targets: ${response.statusText}`);
      }

      const data = await response.json();
      // Handle new API response structure { targets: [...], count: number, summary: {...} }
      const targetsArray = data.targets || data;
      setTargets(Array.isArray(targetsArray) ? targetsArray : []);
    } catch (err) {
      console.error('Error fetching scrape targets:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch scrape targets');
      setTargets([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const createTarget = async (targetData: CreateScrapeTargetRequest): Promise<ScrapeTarget> => {
    try {
      setError(null);
      const response = await fetch('/api/scrape-targets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(targetData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to create scrape target: ${response.statusText}`);
      }

      const responseData = await response.json();
      // Handle new API response structure { success: true, target: {...}, message: string }
      const newTarget = responseData.target || responseData;
      
      setTargets(prev => [...prev, newTarget]);
      return newTarget;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create scrape target';
      setError(message);
      throw new Error(message);
    }
  };

  const updateTarget = async (targetData: UpdateScrapeTargetRequest): Promise<ScrapeTarget> => {
    try {
      setError(null);
      const response = await fetch(`/api/scrape-targets?id=${targetData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(targetData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to update scrape target: ${response.statusText}`);
      }

      const responseData = await response.json();
      // Handle new API response structure { success: true, target: {...}, message: string }
      const updatedTarget = responseData.target || responseData;
      
      setTargets(prev => prev.map(target => 
        target.id === updatedTarget.id ? updatedTarget : target
      ));
      return updatedTarget;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update scrape target';
      setError(message);
      throw new Error(message);
    }
  };

  const deleteTarget = async (id: string): Promise<void> => {
    try {
      setError(null);
      const response = await fetch(`/api/scrape-targets?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to delete scrape target: ${response.statusText}`);
      }

      // Remove from local state immediately
      setTargets(prev => prev.filter(target => target.id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete scrape target';
      setError(message);
      throw new Error(message);
    }
  };

  const toggleTargetActive = async (id: string): Promise<void> => {
    const target = targets.find(t => t.id === id);
    if (!target) {
      throw new Error('Target not found');
    }

    await updateTarget({
      id,
      isActive: !target.isActive,
    });
  };

  const updateTargetField = async (id: string, field: keyof ScrapeTarget, value: any): Promise<void> => {
    await updateTarget({
      id,
      [field]: value,
    });
  };

  useEffect(() => {
    fetchTargets();
  }, []);

  return (
    <ScrapeTargetsContext.Provider value={{
      targets,
      loading,
      error,
      fetchTargets,
      createTarget,
      updateTarget,
      deleteTarget,
      toggleTargetActive,
      updateTargetField,
    }}>
      {children}
    </ScrapeTargetsContext.Provider>
  );
}