'use client'

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { FaGithub } from "react-icons/fa";
import Image from "next/image"; 

export default function HeaderComponent() {
  return (
    <header className="w-full flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
      {/* GitHub Button */}
      <a
        href="https://github.com/YOUR_GITHUB_REPO"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 text-sm font-medium hover:opacity-80 transition"
      >
        <FaGithub size={20} />
        <span className="hidden sm:inline">GitHub</span>
      </a>

      {/* Title */}
      <h1 className="text-xl font-semibold">AnyToken</h1>

      {/* Wallet Connect Button */}
      <ConnectButton />
    </header>
  );
}
