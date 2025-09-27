// pages/_app.tsx
import type { AppProps } from 'next/app';
import '../styles/globals.css';
import Layout from '../components/Layout';
import { useEffect } from 'react';

export default function MyApp({ Component, pageProps }: AppProps) {
  // ensure .compact is present by default; remove if you prefer non-compact initial state
  useEffect(() => {
    if (!document.documentElement.classList.contains('compact')) {
      document.documentElement.classList.add('compact');
    }
  }, []);

  return (
    // keep Layout inside root so Layout can render header/sidebar/content
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}
