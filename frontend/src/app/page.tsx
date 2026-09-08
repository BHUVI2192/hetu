'use client';

import nextDynamic from 'next/dynamic';

export const dynamic = 'force-dynamic';

const Home = nextDynamic(() => import('@/ui-pages/Home'), {
  ssr: false,
});

export default function Page() {
  return <Home />;
}
