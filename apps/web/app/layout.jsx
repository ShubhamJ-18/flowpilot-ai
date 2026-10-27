import './globals.css';
import { AuthProvider } from '../lib/auth-context';

export const metadata = {
  title: 'FlowPilot AI — Intelligent Workflow Automation Platform',
  description: 'AI-assisted workflow automation platform that converts natural language business descriptions into executable visual workflows.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-indigo-500 selection:text-white">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
