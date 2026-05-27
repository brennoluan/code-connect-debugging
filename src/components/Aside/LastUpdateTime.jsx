"use client";

import { useEffect, useState } from "react";

export const LastUpdateTime = () => {
  const [time, setTime] = useState(null);

  useEffect(() => {
    setTime(new Date().toLocaleString("pt-BR"));
  }, []);

  return <time>{time || "carregando..."}</time>;
};
