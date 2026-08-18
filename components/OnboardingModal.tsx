"use client";

import React, { useState } from "react";
import { useGraph } from "@/context/GraphContext";
import { Sparkles, ArrowRight, User } from "lucide-react";

export function OnboardingModal() {
  const { userProfile, updateUserProfile } = useGraph();
  const [name, setName] = useState(userProfile.name || "");
  const [age, setAge] = useState<string>(userProfile.age ? String(userProfile.age) : "");

  if (userProfile.hasCompletedOnboarding) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = name.trim() || "Explorer";
    const finalAge = age.trim() ? parseInt(age.trim(), 10) : undefined;

    updateUserProfile({
      name: finalName,
      age: finalAge,
      hasCompletedOnboarding: true,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 font-sans select-none">
      <div className="relative w-full max-w-md bg-[#1c1c1c] border border-[#333333] rounded-3xl shadow-2xl p-6 sm:p-8 text-[#ececec]">
        {/* Brand Icon */}
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center text-white font-bold mb-4 shadow-lg shadow-indigo-500/10">
          <Sparkles className="w-6 h-6" />
        </div>

        {/* Title */}
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 tracking-tight">
          Welcome to ThinkFlow
        </h2>
        <p className="text-xs text-[#8e8e8e] leading-relaxed mb-6 font-mono">
          Personalize your AI canvas. Tell us your name so AI can address you naturally during deep explorations.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-indigo-400" />
              <span>Your Name</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Nikhil Reddy"
              className="w-full bg-[#141414] border border-[#333333] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-[#666666] focus:outline-none focus:border-indigo-500"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Age <span className="text-[10px] text-[#666666] font-normal">(Optional)</span>
            </label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="e.g. 21"
              min="1"
              max="120"
              className="w-full bg-[#141414] border border-[#333333] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-[#666666] focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-white text-black hover:bg-[#e0e0e0] font-semibold text-xs shadow-md active:scale-98 transition-all"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
