'use client';

import dynamic from 'next/dynamic';

export const dynamic = 'force-dynamic';

const Home = dynamic(() => import('@/ui-pages/Home'), {
  ssr: false,
});

export default function Page() {
  return <Home />;
}
