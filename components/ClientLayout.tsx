'use client';
import usePageView from '../app/hooks/usePageView';

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  usePageView();
  return <>{children}</>;
}