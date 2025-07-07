'use client';

import BottomNav from './BottomNav';

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  return (
    <>
      <main className="pb-16">
        {children}
      </main>
      <BottomNav />
    </>
  );
}