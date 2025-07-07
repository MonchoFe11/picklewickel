import { notFound } from 'next/navigation';
import MatchDetailClient from './MatchDetailClient';
import { getMatchById } from '../../../lib/serverMatches';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const match = await getMatchById(params.id);
  
  if (!match) {
    return {
      title: 'PickleWickel',
      description: 'Follow live pickleball scores & tournaments on PickleWickel.',
      openGraph: {
        title: 'PickleWickel',
        description: 'Live pickleball scores & tournaments.',
        images: [{ url: '/logo.png', width: 1200, height: 630 }],
      },
      twitter: {
        card: 'summary_large_image',
        title: 'PickleWickel',
        description: 'Live pickleball scores & tournaments.',
        images: ['/logo.png'],
      },
    };
  }

  const t1 = match.team1?.players.map(p=>p.name).join('/') ?? 'Team 1';
  const t2 = match.team2?.players.map(p=>p.name).join('/') ?? 'Team 2';
  const title = `${t1} vs ${t2} | PickleWickel`;
  const description = `Follow the ${match.tournamentName} • ${match.drawName} • ${match.round} on PickleWickel`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: '/logo.png', width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/logo.png'],
    },
  };
}

export default async function MatchPage({ params }: Props) {
  const match = await getMatchById(params.id);
  if (!match) return notFound();
  return <MatchDetailClient match={match} />;
}