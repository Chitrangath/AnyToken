'use client'

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { FaGithub } from "react-icons/fa";
import { useState, useEffect } from "react";

export default function HeaderComponent() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 w-full z-50 transition-all duration-500 ${
      scrolled 
        ? 'bg-gray-900/95 backdrop-blur-xl border-b border-purple-500/20 shadow-lg shadow-purple-500/10' 
        : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* GitHub Button */}
          <a
            href="https://github.com/YOUR_GITHUB_REPO"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 px-4 py-2 rounded-full bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20"
          >
            <FaGithub className="text-white group-hover:text-purple-400 transition-colors duration-300" size={20} />
            <span className="hidden sm:inline text-white font-medium">GitHub</span>
          </a>

          {/* Title with animated gradient */}
          <div className="relative">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent animate-pulse">
              TSender
            </h1>
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 rounded-lg blur opacity-20 animate-pulse"></div>
          </div>

          {/* Wallet Connect Button */}
          <div className="relative">
            <ConnectButton />
          </div>
        </div>
      </div>
    </header>
  );
}