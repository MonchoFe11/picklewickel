export function track(eventName: string, props: Record<string, any> = {}) {
    if (process.env.NEXT_PUBLIC_ANALYTICS_ENABLED !== 'true') return;
    // window.plausible is injected by the script
    if (typeof window !== 'undefined' && (window as any).plausible) {
      (window as any).plausible(eventName, { props });
    }
  }