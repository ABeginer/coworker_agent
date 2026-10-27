import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Agent Task Management Dashboard',
  description: 'Real-time task dispatch and agent swarm streaming interface',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-zinc-50 dark:bg-zinc-950 antialiased">
        {children}
      </body>
    </html>
  );
}
