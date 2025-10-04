import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";

export const metadata: Metadata = {
  title: "掃區評比系統",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable}`}>
      <body className="bg-neutral-50">
        <TRPCReactProvider>{children}</TRPCReactProvider>
        <script defer src="https://cloud.umami.is/script.js" data-website-id="de77df28-58bf-43e8-aada-e56af5ff7e44"></script>
      </body>
    </html>
  );
}
