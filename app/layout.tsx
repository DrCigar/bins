import type { Metadata } from "next";
import { Figtree, DM_Serif_Display } from "next/font/google";
import "./globals.css";

const figtree = Figtree({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-figtree",
});

const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-dm-serif",
});

export const metadata: Metadata = {
  title: "Register Locator — POS360",
  description: "Warehouse cash-register locator",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${figtree.variable} ${dmSerif.variable} h-full antialiased`}>
      <body className="min-h-full bg-pos-black text-white">
        <div
          aria-hidden
          className="fixed inset-0 -z-10"
          style={{
            backgroundColor: "#000000",
            backgroundImage: "linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.7)), url(/honeycomb-bg.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        />
        {children}
      </body>
    </html>
  );
}
