import './globals.css';
import './onboarding.css';

export const metadata = {
  title: 'SignalForge AI',
  description: 'AI-assisted market intelligence and paper trading dashboard',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
