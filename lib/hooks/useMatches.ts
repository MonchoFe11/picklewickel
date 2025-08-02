// Create new file: lib/hooks/useMatches.ts

import useSWR from 'swr';
import { Match } from '../../app/types/match';

// The fetcher function is a simple wrapper around the native fetch API.
const fetcher = (url: string) => fetch(url).then(res => res.json());

export function useMatchesSWR(initialData: Match[]) {
  const { data, error, isLoading } = useSWR<Match[]>('/api/matches/scraped', fetcher, {
    // Pass the server-fetched data as the initial data.
    fallbackData: initialData,

    // Automatically refetch data every 20 seconds.
    refreshInterval: 20000,

    // Automatically refetch when the user re-focuses the browser tab.
    revalidateOnFocus: true,
  });

  return {
    matches: data || [],
    isLoading,
    isError: error,
  };
}