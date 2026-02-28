import useSWR from 'swr';
import { Match } from '../../app/types/match';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function useMatchesSWR(initialData: Match[]) {
  const { data, error, isLoading } = useSWR<Match[]>('/api/matches/scraped', fetcher, {
    fallbackData: initialData,
    refreshInterval: 30000,
    dedupingInterval: 5000,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  return {
    matches: data || [],
    isLoading,
    isError: error,
  };
}
