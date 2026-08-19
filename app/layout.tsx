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
      <body className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] antialiased selection:bg-[#0071E3]/20">
        {children}
      </body>
    </html>
  );
}
