'use client';

import Link from 'next/link';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-surface text-onSurface flex flex-col items-center justify-center p-8 pb-24">
      
      {/* Main content with improved spacing */}
      <div className="flex flex-col items-center space-y-6 md:space-y-8">
        
        {/* Logo - larger on mobile */}
        <Logo />

        {/* Title - responsive typography with overflow protection */}
        <h1
          className="text-3xl xs:text-4xl md:text-5xl font-bold tracking-[0.2em] xs:tracking-[0.25em] text-center break-words max-w-full px-4"
          style={{ fontFamily: 'var(--font-mont)' }}
        >
          PICKLE
          <span className="text-muted-green">WICKEL</span>
        </h1>
        
        {/* Subtitle - better mobile constraints */}
        <p className="mt-4 md:mt-6 text-center text-pickle-text-muted max-w-xs md:max-w-md mx-auto leading-relaxed">
          Your mobile first pickleball companion for live scores and tournaments
        </p>

        {/* Button container for consistent spacing */}
        <div className="flex flex-col space-y-4 w-full items-center">
          
          {/* Get Started Button - constrained width */}
          <Link 
            href="/scores"
            className="w-full max-w-xs md:max-w-sm bg-muted-green hover:bg-muted-green/80 text-black text-center py-4 rounded-lg font-medium text-lg transition-colors"
          >
            Get Started
          </Link>

          {/* Learn More Button - constrained width */}
          <Link 
            href="/about"
            className="w-full max-w-xs md:max-w-sm border border-muted-green text-muted-green hover:bg-muted-green/10 text-center py-4 rounded-lg font-medium text-lg transition-colors"
          >
            Learn More
          </Link>

          {/* Theme Toggle */}
          <div className="mt-6">
            <ThemeToggle />
          </div>
          
        </div>
        
      </div>

    </div>
  );
}