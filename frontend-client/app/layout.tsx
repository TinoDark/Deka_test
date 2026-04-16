import './globals.css';

export const metadata = {
  title: 'DEKA Client | Vitrine',
  description: 'Vitrine publique DEKA connectée au backend principal.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}
