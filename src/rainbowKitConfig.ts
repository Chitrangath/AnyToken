"use client"

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { anvil, zksync, mainnet} from "wagmi/chains";

export default getDefaultConfig ({
    appName: "Tsender",
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,// exclamation mark says the PROJECT ID WILL EXIST
    chains: [anvil,zksync, mainnet],
    ssr: false, // SSR = Server Side Rendering

})