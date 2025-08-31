import React from "react";
import BAIIHowToModule from "@/components/BAIIHowToModule";

export default function CanvasPage() {
  return (
    <main className="min-h-screen bg-neutral-900 text-gray-100 text-lg md:text-xl">
      <div className="max-w-screen-2xl mx-auto p-8 md:p-12">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-semibold text-white">Calculator</h1>
          <a href="/" className="rounded-full px-4 py-1.5 text-sm border bg-gray-300 text-gray-900 shadow hover:bg-gray-400">← Back to Game</a>
        </div>
        <p className="text-gray-300 mb-6">Enter your own numbers, and see the solutions populate in each method.</p>
        <BAIIHowToModule mode="canvas" />
      </div>
    </main>
  );
}


