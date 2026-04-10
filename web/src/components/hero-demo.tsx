"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

// Prevent SSR hydration mismatch — render only on client
const HeroDemoInner = dynamic(() => import("./hero-demo-inner"), {
  ssr: false,
  loading: () => (
    <div className="relative w-[400px] select-none">
      <div className="bg-white/[0.08] backdrop-blur-sm border border-white/[0.12] rounded-2xl h-[440px]" />
    </div>
  ),
});

export function HeroDemo() {
  return <HeroDemoInner />;
}
