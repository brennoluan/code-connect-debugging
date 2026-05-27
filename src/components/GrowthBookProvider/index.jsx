"use client";

import { useEffect } from "react";
import { GrowthBookProvider as GBProvider } from "@growthbook/growthbook-react";
import { gb } from "@/lib/growthbook";

export function GrowthBookProvider({ children }) {
  useEffect(() => {
    // Inicializar e carregar features do GrowthBook
    const initGrowthBook = async () => {
      try {
        await gb.init();
        console.log("✅ GrowthBook inicializado e features carregadas");
      } catch (error) {
        console.error("❌ Erro ao inicializar GrowthBook:", error);
      }
    };

    initGrowthBook();
  }, []);

  return <GBProvider growthbook={gb}>{children}</GBProvider>;
}
