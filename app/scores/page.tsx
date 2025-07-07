import ScoresPageClient from './ScoresPageClient';

interface ScoresPageProps {
  searchParams: {
    date?: string;
  };
}

export default function ScoresPage({ searchParams }: ScoresPageProps) {
  const queryDate = searchParams.date || null;
  return <ScoresPageClient initialDate={queryDate} />;
}