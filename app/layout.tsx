import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "@/providers/app-providers";
export const metadata: Metadata = {
  title: "PG Finder · Ops Console",
  description: "A calm workspace for reviewing synthetic PG Finder call operations.",
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
