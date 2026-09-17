import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://atlas-assassinatos-multiplos-equador.solar-eft-4458.chatgpt.site'),
  title: 'Atlas dos Assassinatos Múltiplos — Equador',
  description: 'Mapa interativo da distribuição territorial de assassinatos múltiplos registrados entre 2023 e 2025.',
  openGraph: {
    title: 'Atlas dos Assassinatos Múltiplos — Equador',
    description: 'Distribuição territorial de ocorrências registradas entre 2023 e 2025.',
    images: ['/og.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Atlas dos Assassinatos Múltiplos — Equador',
    description: 'Distribuição territorial de ocorrências registradas entre 2023 e 2025.',
    images: ['/og.png'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
