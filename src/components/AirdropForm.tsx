"use client"

import { InputForm } from "@/components/ui/InputField";
import { useState, useMemo, useEffect } from "react";
import { chainsToTSender, tsenderAbi, erc20Abi } from "@/constants";
import { useChainId, useConfig, useAccount, useWriteContract } from "wagmi";
import { readContract, waitForTransactionReceipt } from "@wagmi/core";
import { calculateTotal } from "@/utils";

export default function AirdropForm(){
    const [mounted, setMounted] = useState(false);
    const [tokenAddress, setTokenAddress] = useState("")
    const [receiverAddress, setReceiverTokenAddress] = useState("")
    const [amounts, setAmount] = useState("")
    const chainId = useChainId()
    const config = useConfig()
    const account = useAccount()
    const total: number = useMemo(() => calculateTotal(amounts), [amounts])
    const { data: hash, isPending, writeContractAsync } = useWriteContract()

    useEffect(() => {
        setMounted(true);
    }, []);

    // Don't render until component is mounted on client
    if (!mounted) {
        return (
            <div className="space-y-4 p-4">
                <div className="animate-pulse">
                    <div className="h-16 bg-gray-200 rounded mb-4"></div>
                    <div className="h-32 bg-gray-200 rounded mb-4"></div>
                    <div className="h-32 bg-gray-200 rounded mb-4"></div>
                    <div className="h-12 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    async function getApprovedAmount(tSenderAddress: string | null): Promise<number>{
        if (!tSenderAddress || !account.address) {
            alert("No address found, please use a supported chain")
            return 0;
        }
        
        try {
            const response = await readContract(config, {
                abi: erc20Abi,
                address: tokenAddress as `0x${string}`,
                functionName: "allowance",
                args: [account.address as `0x${string}`, tSenderAddress as `0x${string}`],
            })
            return Number(response);
        } catch (error) {
            console.error("Error reading allowance:", error);
            return 0;
        }
    }

    async function handleSubmit() {
        if (!account.address) {
            alert("Please connect your wallet");
            return;
        }

        try {
            const tSenderAddress = chainsToTSender[chainId]["tsender"]
            if (!tSenderAddress) {
                alert("No tSender contract found for this chain");
                return;
            }

            console.log("Starting transaction process...");
            const approvedAmount = await getApprovedAmount(tSenderAddress)
            console.log("Current approved amount:", approvedAmount);
            console.log("Total needed:", total);

            // Step 1: Approve if needed (but don't stop here)
            if (approvedAmount < total) {
                console.log("Insufficient allowance, requesting approval...");
                const approvalHash = await writeContractAsync({
                    abi: erc20Abi,
                    address: tokenAddress as `0x${string}`,
                    functionName: "approve", 
                    args: [tSenderAddress as `0x${string}`, BigInt(total)],
                })
                
                console.log("Approval transaction hash:", approvalHash);
                const approvalReceipt = await waitForTransactionReceipt(config, {
                    hash: approvalHash,
                })
                console.log("Approval confirmed:", approvalReceipt);
            } else {
                console.log("Sufficient allowance already exists");
            }

            // Step 2: Always execute airdrop (whether we just approved or already had approval)
            console.log("Executing airdrop...");
            const recipients = receiverAddress.split(/[,\n]+/).map(addr => addr.trim()).filter(addr => addr !== '');
            const amountArray = amounts.split(/[,\n]+/).map(amt => BigInt(amt.trim())).filter(amt => amt > BigInt(0));

            console.log("Recipients:", recipients);
            console.log("Amounts:", amountArray);

            const airdropHash = await writeContractAsync({
                abi: tsenderAbi,
                address: tSenderAddress as `0x${string}`,
                functionName: "airdropERC20",
                args: [
                    tokenAddress as `0x${string}`,
                    recipients,
                    amountArray,
                    BigInt(total), // Added the 4th parameter - total amount
                ],
            })

            console.log("Airdrop transaction hash:", airdropHash);
            const airdropReceipt = await waitForTransactionReceipt(config, {
                hash: airdropHash,
            })
            console.log("Airdrop confirmed:", airdropReceipt);
            alert("Airdrop completed successfully!");

        } catch (error) {
            console.error("Detailed error in handleSubmit:", error);
            
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error("Error message:", errorMessage);
            
            // Handle specific error types
            if (errorMessage.includes('user rejected')) {
                alert("Transaction was cancelled by user");
            } else if (errorMessage.includes('insufficient funds')) {
                alert("Insufficient funds for transaction");
            } else if (errorMessage.includes('execution reverted')) {
                alert("Transaction reverted. Check contract parameters and balances.");
            } else {
                alert(`Transaction failed: ${errorMessage || 'Unknown error'}`);
            }
        }
    }

    return(
        <div className="space-y-4 p-4">
            <InputForm
                label="Token Address"
                placeholder="Enter the token address"
                value={tokenAddress}
                onChange={e => setTokenAddress(e.target.value)}
            />
            <InputForm
                label="Receiver Address"
                placeholder="Enter receiver addresses (one per line or comma separated)"
                value={receiverAddress}
                large={true}
                onChange={e => setReceiverTokenAddress(e.target.value)}
            />
            <InputForm
                label="Amount"
                placeholder="Enter amounts (one per line or comma separated)"
                value={amounts}
                large={true}
                onChange={e => setAmount(e.target.value)}
            />
            
            {total > 0 && (
                <div className="text-sm text-gray-600">
                    Total tokens needed: {total}
                </div>
            )}

            <button 
                onClick={handleSubmit}
                className="bg-gradient-to-r from-orange-400 to-yellow-400 hover:from-orange-500 hover:to-yellow-500 text-slate-900 font-bold py-3 px-8 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 border border-orange-300 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isPending || !account.address}
            >
                {isPending ? "⏳ Processing..." : "🚀 Send Tokens"}
            </button>
        </div>
    )
}