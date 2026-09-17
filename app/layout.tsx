import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://atlas-assassinatos-multiplos-equador.solar-eft-4458.chatgpt.site'),
  title: 'Atlas de los Asesinatos Múltiples — Ecuador',
  description: 'Mapa interactivo de la distribución territorial de asesinatos múltiples registrados entre 2023 y 2025.',
  openGraph: {
    title: 'Atlas de los Asesinatos Múltiples — Ecuador',
    description: 'Distribución territorial de hechos registrados entre 2023 y 2025.',
    images: ['/og.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Atlas de los Asesinatos Múltiples — Ecuador',
    description: 'Distribución territorial de hechos registrados entre 2023 y 2025.',
    images: ['/og.png'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
