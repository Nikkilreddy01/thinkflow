"use client";

import React from "react";
import { GraphProvider, useGraph } from "@/context/GraphContext";
import { Sidebar } from "@/components/Sidebar";
import { Navbar } from "@/components/Navbar";
import { ChatView } from "@/components/chat/ChatView";
import { CanvasView } from "@/components/canvas/CanvasView";
import { FocusModeModal } from "@/components/FocusModeModal";
import { SelectionToolbar } from "@/components/SelectionToolbar";

function MainApp() {
  const { viewMode } = useGraph();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#212121] text-white font-sans antialiased select-none relative">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Workspace Column */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Bar Navigation */}
        <Navbar />

        {/* Workspace View Mode (Chat or Canvas) */}
        <main className="flex-1 flex overflow-hidden relative">
          {viewMode === "chat" ? (
            <div className="w-full h-full">
              <ChatView />
            </div>
          ) : (
            <div className="w-full h-full">
              <CanvasView />
            </div>
          )}
        </main>
      </div>

      {/* Focus Mode Overlay (Maximized on Double Click) */}
      <FocusModeModal />

      {/* Single Global Selection Toolbar instance */}
      <SelectionToolbar />
    </div>
  );
}

export default function Home() {
  return (
    <GraphProvider>
      <MainApp />
    </GraphProvider>
  );
}
