import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-surface text-onSurface p-4 pb-24">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-muted-green mb-4">About PickleWickel</h1>
          <p className="text-xl text-onSurface/80 italic">
            The pickleball app that's still figuring it out (just like you)
          </p>
        </div>

        {/* What's This All About */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-muted-green mb-4">What's This All About?</h2>
          <p className="text-onSurface/80 text-lg leading-relaxed mb-4">
            We're building a pickleball app that actually makes sense. Go figure...
          </p>
        </div>

        {/* The Real Talk */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-muted-green mb-4">The Real Talk</h2>
          <p className="text-onSurface/80 text-lg leading-relaxed mb-4">
            PickleWickel is in <span className="font-bold text-muted-green">BETA mode</span>, which is fancy tech speak for "it's kinda working, but also kinda not." Some days you'll pull up the app and see every tournament score perfectly laid out like a work of art. Other days? You might see tumbleweeds. 🌵
          </p>
          <p className="text-onSurface/80 text-lg leading-relaxed">
            The app might look different every time you open it because we're basically redesigning it in real-time based on what makes sense (and what doesn't make us want to throw our phones).
          </p>
        </div>

        {/* Why Should You Care */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-muted-green mb-4">Why Should You Care?</h2>
          <p className="text-onSurface/80 text-lg leading-relaxed">
            Because we're not some corporate suits in a boardroom guessing what pickleball players want. We're actual players who've been dinked into oblivion and know the pain of trying to find tournament scores on sketchy websites that look like they were built in 2003.
          </p>
        </div>

        {/* We Need Your Vibe Check */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-muted-green mb-4">We Need Your Vibe Check</h2>
          <p className="text-onSurface/80 text-lg leading-relaxed mb-4">
            We could build this thing in a vacuum and hope for the best, OR we could have awesome players like you tell us when we're being brilliant vs. when we're being complete disasters.
          </p>
          <p className="text-onSurface/80 text-lg leading-relaxed">
            Spot a bug? Tell us. Love a feature? Tell us. Think our color scheme makes your eyes bleed? DEFINITELY tell us.
          </p>
        </div>

        {/* The Dream */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-muted-green mb-4">The Dream</h2>
          <p className="text-onSurface/80 text-lg leading-relaxed mb-4">
            One day (soon), PickleWickel will be the app that makes checking pickleball scores as addictive as scrolling through that other pickleball app that bombards you with ads just so you can validate your existence and measure yourself against other players. Until then, we're your friendly neighborhood beta testers who accidentally made an app.
          </p>
          <p className="text-onSurface/80 text-lg leading-relaxed">
            Slide into our DMs (okay, email us) at{' '}
            <a 
              href="mailto:info@picklewickel.com" 
              className="text-muted-green hover:text-muted-green/80 underline font-semibold"
            >
              info@picklewickel.com
            </a>
            {' '}with literally any feedback. Roast us, praise us – we're here for all of it.
          </p>
        </div>

        {/* Back to App */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-block bg-muted-green text-black px-8 py-3 rounded-lg font-semibold hover:bg-muted-green/80 transition-colors"
          >
            Back to PickleWickel
          </Link>
        </div>
      </div>
    </div>
  );
}