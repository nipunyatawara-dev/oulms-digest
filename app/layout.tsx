import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'OUSL LMS Digest — Academic Updates & Announcements',
  description: 'Clean personal digest dashboard for Open University of Sri Lanka LMS.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#fbf8f5',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#fbf8f5] text-[#4e080c] antialiased selection:bg-[#4e080c]/10">
        {children}
      </body>
    </html>
  );
}

