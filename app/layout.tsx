import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getEmbedTheme } from "@/features/embed/api";
import { EmbedThemeReceiver } from "@/features/embed/components/EmbedThemeReceiver";
import {
  SERVICE_NAME,
  SERVICE_THEME_COLOR,
  THEME_RESTORE_SCRIPT,
  cn,
} from "@/library";

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
      // NOTE: 保存されたテーマを hydration 前に data-theme へ反映するため、サーバーの値との差分を許容する
      suppressHydrationWarning
      className={cn(
        geistSans.variable,
        geistMono.variable,
        "h-full antialiased",
      )}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_RESTORE_SCRIPT }} />
      </head>
      <body className="bg-surface text-contrast flex min-h-full flex-col">
        <div className="w-full flex-1">{children}</div>
        <EmbedThemeReceiver />
      </body>
    </html>
  );
}
