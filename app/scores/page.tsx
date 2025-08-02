import ScoresPageClient from './ScoresPageClient';

interface ScoresPageProps {
  searchParams: {
    date?: string;
  };
}

export default async function ScoresPage({ searchParams }: ScoresPageProps) {
  const queryDate = searchParams.date || null;
  
  // Always start with empty array for client-side hydration
  // Client will fetch data and handle Redis errors gracefully
  const initialMatches: any[] = [];
  
  return <ScoresPageClient initialDate={queryDate} initialMatches={initialMatches} />;
}