"use client";

import { useEffect } from "react";
import { initSpotlight } from "@/lib/spotlight";

export function SpotlightClient() {
  useEffect(() => {
    const cleanup = initSpotlight();
    return () => cleanup();
  }, []);

  return null;
}
