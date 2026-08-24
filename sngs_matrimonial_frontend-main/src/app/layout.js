import { Maven_Pro, Viga, Telex } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const maven = Maven_Pro({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-maven",
});

const viga = Viga({
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
  variable: "--font-viga",
});

const telex = Telex({
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
  variable: "--font-telex",
});

export const metadata = {
  title: "SNGS Matrimonial",
  description: "Find your perfect match on SNGS Matrimonial",
  icons: {
    icon: '/icon.png',
    apple: '/apple-icon.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${maven.variable} ${viga.variable} ${telex.variable}`}>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
