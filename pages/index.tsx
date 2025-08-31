import React from "react";
import dynamic from "next/dynamic";

// Dynamically import in case UI deps aren't available at build
const BAIIHowToModule = dynamic(() => import("@/components/BAIIHowToModule"), { ssr: false });

export default function Page() {
  return (
    <main className="min-h-screen bg-neutral-900 text-gray-100 p-6 md:p-10 text-lg md:text-xl">
      <BAIIHowToModule
        initial={{ salary: 80000, wrrPct: 0.75, ssPension: 20000, yearsToRetire: 15, yearsInRetirement: 33, nominalRet: 0.08, inflation: 0.03 }}
      />
    </main>
  );
}

