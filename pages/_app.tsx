// pages/_app.tsx
import type { AppProps } from 'next/app';
import '../styles/globals.css';
import 'react-quill/dist/quill.snow.css'; // ensure Quill styles are loaded once
import Layout from '../components/Layout';
import { useEffect } from 'react';

export default function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    if (!document.documentElement.classList.contains('compact')) {
      document.documentElement.classList.add('compact');
    }
  }, []);

  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}
