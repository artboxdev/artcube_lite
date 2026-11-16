import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#08000c",
};

export const metadata: Metadata = {
  title: "Sakuraverse — ART.CUBE Experience",
  description: "Interactive ART.CUBE demo experience",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Sakuraverse",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="de"
      className="wave h-full antialiased"
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
