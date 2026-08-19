import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'OUSL LMS Digest — Academic Updates & Announcements',
  description: 'Clean personal digest dashboard for Open University of Sri Lanka LMS.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F4F4F0] text-[#18181B] antialiased selection:bg-black/10">
        {children}
      </body>
    </html>
  );
}

