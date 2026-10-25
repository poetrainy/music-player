import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getEmbedTheme } from "@/features/embed/api";
import { SERVICE_NAME, SERVICE_THEME_COLOR, cn } from "@/library";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SERVICE_DESCRIPTION = "プレイリストから音楽を聴くことができます。";

export const metadata: Metadata = {
  title: {
    default: SERVICE_NAME,
    template: `%s｜${SERVICE_NAME}`,
  },
  description: SERVICE_DESCRIPTION,
  openGraph: {
    title: SERVICE_NAME,
    description: SERVICE_DESCRIPTION,
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: SERVICE_THEME_COLOR,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const theme = await getEmbedTheme();

  return (
    <html
      lang="ja"
      data-theme={theme}
      className={cn(
        geistSans.variable,
        geistMono.variable,
        "h-full antialiased",
      )}
    >
      <body className="bg-surface text-contrast flex min-h-full flex-col">
        <div className="w-full flex-1">{children}</div>
      </body>
    </html>
  );
}
