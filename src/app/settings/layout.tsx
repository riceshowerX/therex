import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Settings',
  description: 'Configure AI providers, API keys, and editor preferences for MarkFlow.',
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
