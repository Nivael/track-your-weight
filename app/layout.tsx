import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: '轻一点 · 我的减重面板',
  icons: { icon: '/favicon.svg' },
  description: '本地减重记录、饮食、运动和体型对比。',
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
