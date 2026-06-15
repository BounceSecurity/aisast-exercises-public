import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Navbar from "@/components/Navbar";
import { UserProvider } from "@/lib/UserContext";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <UserProvider>
      <div className="grain-overlay" />
      <Navbar />
      <main className="min-h-screen">
        <Component {...pageProps} />
      </main>
    </UserProvider>
  );
}
