'use client';
import { Suspense } from 'react';
import usePageView from '../app/hooks/usePageView';

function PageViewTracker() {
  usePageView();
  return null;
}

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <>
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
      {children}
    </>
  );
}
