"use client"

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { anvil, sepolia, goerli, holesky, zksync, mainnet, optimism, arbitrum, polygon} from "wagmi/chains";

export default getDefaultConfig ({
    appName: "AnyToken",
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,// exclamation mark says the PROJECT ID WILL EXIST
    chains: [anvil, sepolia, goerli, holesky, zksync, mainnet, optimism, arbitrum, polygon],
    ssr: false, // SSR = Server Side Rendering

})