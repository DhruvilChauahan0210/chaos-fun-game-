import './globals.css';

export const metadata = {
  title: 'Chaos Sandbox | Multiplayer Physics Playground',
  description: 'A chaotic multiplayer physics sandbox where players spawn objects, cause explosions, and flip gravity together. No goals, no winners - just pure mayhem!',
  keywords: ['physics', 'sandbox', 'multiplayer', 'game', 'chaos', 'Matter.js'],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
