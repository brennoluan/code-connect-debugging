import { Prompt } from "next/font/google";
import { LayoutProvider } from "../components/LayoutProvider";
import "./globals.css";
import { GrowthBookProvider } from "@/components/GrowthBookProvider";

export const metadata = {
  title: "Code Connect",
  description: "Uma rede social para devs!",
};

const prompt = Prompt({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  display: "swap",
});

export default function RootLayout({ children }) {
  return (
    <html lang="pt-br" className={prompt.className}>
      <body>
        <GrowthBookProvider>
          <LayoutProvider>{children}</LayoutProvider>
        </GrowthBookProvider>
      </body>
    </html>
  );
}
