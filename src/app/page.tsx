"use client"

import HomeContent from "@/components/HomeContent";
import { useAccount } from "wagmi";

export default function Home() {
  const { isConnected } = useAccount()
  return (
    <div>
      {isConnected ? (
        <div>
          <HomeContent/>
        </div>
        ): (
       <div className="flex justify-center items-center h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl px-8 py-6 shadow-xl text-center">
            <h2 className="text-2xl font-bold text-white mb-2">
               Wallet Not Connected
           </h2>
          <p className="text-white/80 text-base">
            Please connect your wallet to continue using the platform.
          </p>
        </div>
</div>

        )
      }  
    </div>
  );  
}
