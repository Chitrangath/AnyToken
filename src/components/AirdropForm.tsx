"use client"

import { InputForm } from "@/components/ui/InputField";
import { useState, useMemo, useEffect } from "react";
import { chainsToTSender, tsenderAbi, erc20Abi } from "@/constants";
import { useChainId, useConfig, useAccount, useWriteContract } from "wagmi";
import { readContract, waitForTransactionReceipt } from "@wagmi/core";
import { calculateTotal } from "@/utils";
import { FaCoins, FaUsers, FaCheckCircle, FaInfoCircle } from "react-icons/fa";

// Stats Card Component
function StatsCard({ icon: Icon, title, value, description }: {
    icon: React.ComponentType<{ className?: string; size?: number }>;
    title: string;
    value: string;
    description: string;
}) {
    return (
        <div className="group relative p-6 bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl border border-gray-700/50 hover:border-purple-500/50 transition-all duration-500 hover:shadow-xl hover:shadow-purple-500/20 backdrop-blur-sm">
            <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-xl">
                    <Icon className="text-purple-400 group-hover:text-purple-300 transition-colors duration-300" size={24} />
                </div>
                <div>
                    <h3 className="text-white font-semibold text-lg">{title}</h3>
                    <p className="text-gray-400 text-sm">{description}</p>
                </div>
            </div>
            <div className="text-2xl font-bold text-transparent bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text">
                {value}
            </div>
            {/* Hover glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"></div>
        </div>
    );
}

export default function AirdropForm(){
    const [mounted, setMounted] = useState(false);
    const [tokenAddress, setTokenAddress] = useState("")
    const [receiverAddress, setReceiverTokenAddress] = useState("")
    const [amounts, setAmount] = useState("")
    const [notification, setNotification] = useState<{type: 'success' | 'error' | 'info', message: string} | null>(null)
    const [tokenDecimals, setTokenDecimals] = useState<number | null>(null)
    const [tokenSymbol, setTokenSymbol] = useState<string>("")
    const [tokenName, setTokenName] = useState<string>("")
    
    const chainId = useChainId()
    const config = useConfig()
    const account = useAccount()
    
    // Convert user input amounts to wei (with decimals)
    const convertedAmounts = useMemo(() => {
        if (!tokenDecimals) return [];
        return amounts.split(/[,\n]+/)
            .map(amt => amt.trim())
            .filter(amt => amt !== '')
            .map(amt => {
                const numAmount = parseFloat(amt);
                if (isNaN(numAmount)) return BigInt(0);
                // Convert to wei: amount * 10^decimals
                return BigInt(Math.floor(numAmount * Math.pow(10, tokenDecimals)));
            });
    }, [amounts, tokenDecimals]);

    // Calculate total in wei
    const totalWei = useMemo(() => {
        return convertedAmounts.reduce((sum, amount) => sum + amount, BigInt(0));
    }, [convertedAmounts]);

    // Total for display (human readable)
    const total = useMemo(() => {
        if (!tokenDecimals) return 0;
        return Number(totalWei) / Math.pow(10, tokenDecimals);
    }, [totalWei, tokenDecimals]);

    const { data: hash, isPending, writeContractAsync } = useWriteContract()

    useEffect(() => {
        setMounted(true);
    }, []);

    // Fetch token info when address changes
    useEffect(() => {
        if (tokenAddress && tokenAddress.length === 42) {
            fetchTokenInfo();
        } else {
            setTokenDecimals(null);
            setTokenSymbol("");
            setTokenName("");
        }
    }, [tokenAddress, config]);

    async function fetchTokenInfo() {
        try {
            setNotification({type: 'info', message: 'Fetching token information...'});
            
            const [decimals, symbol, name] = await Promise.all([
                readContract(config, {
                    abi: erc20Abi,
                    address: tokenAddress as `0x${string}`,
                    functionName: "decimals",
                }) as Promise<number>,
                readContract(config, {
                    abi: erc20Abi,
                    address: tokenAddress as `0x${string}`,
                    functionName: "symbol",
                }) as Promise<string>,
                readContract(config, {
                    abi: erc20Abi,
                    address: tokenAddress as `0x${string}`,
                    functionName: "name",
                }) as Promise<string>
            ]);

            setTokenDecimals(Number(decimals));
            setTokenSymbol(String(symbol));
            setTokenName(String(name));
            setNotification({
                type: 'success', 
                message: `✅ Token info loaded: ${name} (${symbol}) - ${decimals} decimals`
            });
        } catch (error) {
            console.error("Error fetching token info:", error);
            setNotification({
                type: 'error', 
                message: 'Failed to fetch token information. Please check the token address.'
            });
            setTokenDecimals(null);
            setTokenSymbol("");
            setTokenName("");
        }
    }

    // Don't render until component is mounted on client
    if (!mounted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
                <div className="flex items-center justify-center min-h-screen">
                    <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-purple-500"></div>
                </div>
            </div>
        );
    }

    async function getApprovedAmount(tSenderAddress: string | null): Promise<bigint>{
        if (!tSenderAddress || !account.address) {
            setNotification({type: 'error', message: 'No address found, please use a supported chain'})
            return BigInt(0);
        }
        
        try {
            const response = await readContract(config, {
                abi: erc20Abi,
                address: tokenAddress as `0x${string}`,
                functionName: "allowance",
                args: [account.address as `0x${string}`, tSenderAddress as `0x${string}`],
            }) as bigint;
            return response;
        } catch (error) {
            console.error("Error reading allowance:", error);
            setNotification({type: 'error', message: 'Error reading token allowance. Please check the token address.'})
            return BigInt(0);
        }
    }

    async function handleSubmit() {
        if (!account.address) {
            setNotification({type: 'error', message: 'Please connect your wallet'})
            return;
        }

        if (!tokenDecimals) {
            setNotification({type: 'error', message: 'Please enter a valid token address first'})
            return;
        }

        if (convertedAmounts.length === 0) {
            setNotification({type: 'error', message: 'Please enter token amounts'})
            return;
        }

        // Clear any previous notifications
        setNotification(null)

        try {
            const tSenderAddress = chainsToTSender[chainId]["tsender"]
            if (!tSenderAddress) {
                setNotification({type: 'error', message: 'No tSender contract found for this chain'})
                return;
            }

            setNotification({type: 'info', message: 'Starting transaction process...'})
            console.log("Starting transaction process...");
            const approvedAmount = await getApprovedAmount(tSenderAddress)
            console.log("Current approved amount:", approvedAmount.toString());
            console.log("Total needed:", totalWei.toString());

            // Step 1: Approve if needed (but don't stop here)
            if (approvedAmount < totalWei) {
                setNotification({type: 'info', message: 'Insufficient allowance, requesting approval...'})
                console.log("Insufficient allowance, requesting approval...");
                const approvalHash = await writeContractAsync({
                    abi: erc20Abi,
                    address: tokenAddress as `0x${string}`,
                    functionName: "approve", 
                    args: [tSenderAddress as `0x${string}`, totalWei],
                })
                
                console.log("Approval transaction hash:", approvalHash);
                setNotification({type: 'info', message: 'Waiting for approval confirmation...'})
                const approvalReceipt = await waitForTransactionReceipt(config, {
                    hash: approvalHash,
                })
                console.log("Approval confirmed:", approvalReceipt);
                setNotification({type: 'success', message: 'Token approval confirmed!'})
            } else {
                console.log("Sufficient allowance already exists");
            }

            // Step 2: Always execute airdrop (whether we just approved or already had approval)
            setNotification({type: 'info', message: 'Executing airdrop transaction...'})
            console.log("Executing airdrop...");
            const recipients = receiverAddress.split(/[,\n]+/).map(addr => addr.trim()).filter(addr => addr !== '');

            console.log("Recipients:", recipients);
            console.log("Amounts (wei):", convertedAmounts.map(amt => amt.toString()));

            const airdropHash = await writeContractAsync({
                abi: tsenderAbi,
                address: tSenderAddress as `0x${string}`,
                functionName: "airdropERC20",
                args: [
                    tokenAddress as `0x${string}`,
                    recipients,
                    convertedAmounts, // Use converted amounts with proper decimals
                    totalWei, // Use total in wei
                ],
            })

            console.log("Airdrop transaction hash:", airdropHash);
            setNotification({type: 'info', message: 'Waiting for airdrop confirmation...'})
            const airdropReceipt = await waitForTransactionReceipt(config, {
                hash: airdropHash,
            })
            console.log("Airdrop confirmed:", airdropReceipt);
            setNotification({type: 'success', message: '🎉 Airdrop completed successfully!'})

        } catch (error: any) {
            console.error("Detailed error in handleSubmit:", error);
            
            const errorMessage = error?.message || String(error);
            console.error("Error message:", errorMessage);
            
            // Handle specific error types with user-friendly messages
            if (errorMessage.includes('user rejected') || errorMessage.includes('User rejected')) {
                setNotification({type: 'error', message: 'Transaction was cancelled by user'})
            } else if (errorMessage.includes('insufficient funds')) {
                setNotification({
                    type: 'error', 
                    message: '❌ Insufficient ETH for gas fees. Please add more ETH to your wallet and try again.'
                })
            } else if (errorMessage.includes('exceeds the balance of the account')) {
                setNotification({
                    type: 'error', 
                    message: '❌ Insufficient ETH for gas fees. Please add more ETH to your wallet to cover transaction costs.'
                })
            } else if (errorMessage.includes('execution reverted')) {
                setNotification({type: 'error', message: 'Transaction reverted. Check contract parameters and token balances.'})
            } else if (errorMessage.includes('network')) {
                setNotification({type: 'error', message: 'Network error. Please check your connection and try again.'})
            } else {
                setNotification({type: 'error', message: `Transaction failed: ${errorMessage}`})
            }
        }
    }

    // Calculate stats
    const recipientCount = receiverAddress.split(/[,\n]+/).filter(addr => addr.trim() !== '').length;
    const amountCount = amounts.split(/[,\n]+/).filter(amt => amt.trim() !== '').length;

    return(
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl animate-pulse delay-2000"></div>
            </div>

            {/* Main content */} 
            <div className="relative pt-24 pb-12">
                <div className="max-w-4xl mx-auto px-6">
                    {/* Hero section */}
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-full text-purple-300 text-sm font-medium mb-6 animate-fade-in">
                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                            Multi-Chain Token Distribution
                        </div>
                        <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in-up">
                            <span className="text-white">Send Tokens</span>
                            <br />
                            <span className="text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text">
                                Effortlessly
                            </span>
                        </h1>
                        <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed animate-fade-in-up delay-200">
                            Distribute ERC-20 tokens to multiple recipients in a single transaction. 
                            Save time, reduce gas fees, and streamline your token distribution process.
                        </p>
                    </div>

                    {/* Stats cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                        <StatsCard 
                            icon={FaUsers}
                            title="Recipients"
                            value={recipientCount.toString() || "0"}
                            description="Wallet addresses"
                        />
                        <StatsCard 
                            icon={FaCoins}
                            title="Total Amount"
                            value={total > 0 ? total.toLocaleString() : "0"}
                            description={tokenSymbol ? `${tokenSymbol} tokens` : "Tokens to distribute"}
                        />
                        <StatsCard 
                            icon={FaCheckCircle}
                            title="Batch Size"
                            value={amountCount.toString() || "0"}
                            description="Distribution entries"
                        />
                    </div>

                    {/* Token Info Display */}
                    {tokenDecimals !== null && tokenName && (
                        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-2xl p-6 mb-6 animate-fade-in">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500/20 rounded-lg">
                                    <FaInfoCircle className="text-blue-400" size={20} />
                                </div>
                                <div>
                                    <h4 className="text-white font-semibold">{tokenName} ({tokenSymbol})</h4>
                                    <p className="text-gray-400 text-sm">Decimals: {tokenDecimals} • Enter amounts as normal numbers (e.g., 100.5)</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Notification */}
                    {notification && (
                        <div className={`p-4 rounded-xl border-l-4 mb-6 animate-fade-in ${
                            notification.type === 'success' 
                                ? 'bg-green-500/10 border-green-500 text-green-400' 
                                : notification.type === 'error'
                                ? 'bg-red-500/10 border-red-500 text-red-400'
                                : 'bg-blue-500/10 border-blue-500 text-blue-400'
                        }`}>
                            <div className="flex items-center justify-between">
                                <p className="font-medium">{notification.message}</p>
                                <button 
                                    onClick={() => setNotification(null)}
                                    className="text-gray-400 hover:text-white transition-colors"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Main form */}
                    <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl rounded-3xl border border-gray-700/50 p-8 shadow-2xl shadow-purple-500/10">
                        <div className="space-y-8">
                            <InputForm
                                label="🧾 Token Contract Address"
                                placeholder="0x... Enter the ERC-20 token contract address"
                                value={tokenAddress}
                                onChange={e => setTokenAddress(e.target.value)}
                            />
                            
                            <InputForm
                                label="👥 Recipient Addresses"
                                placeholder={`0x1234567890123456789012345678901234567890
0x2345678901234567890123456789012345678901
0x3456789012345678901234567890123456789012

Enter one address per line or separate with commas`}
                                value={receiverAddress}
                                large={true}
                                onChange={e => setReceiverTokenAddress(e.target.value)}
                            />
                            
                            <InputForm
                                label={`💰 Token Amounts ${tokenSymbol ? `(${tokenSymbol})` : ''}`}
                                placeholder={`100
250.5
1000

Enter amounts as normal numbers (e.g., 100.5)
${tokenDecimals ? `Will be automatically converted using ${tokenDecimals} decimals` : 'Token decimals will be detected automatically'}`}
                                value={amounts}
                                large={true}
                                onChange={e => setAmount(e.target.value)}
                            />

                            {/* Summary section */}
                            {total > 0 && tokenSymbol && (
                                <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-2xl p-6 animate-fade-in">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-purple-500/20 rounded-lg">
                                                <FaCoins className="text-purple-400" size={20} />
                                            </div>
                                            <div>
                                                <h4 className="text-white font-semibold">Distribution Summary</h4>
                                                <p className="text-gray-400 text-sm">Review before sending</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-bold text-transparent bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text">
                                                {total.toLocaleString()}
                                            </p>
                                            <p className="text-sm text-gray-400">Total {tokenSymbol} needed</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Send Button */}
                            <button 
                                onClick={handleSubmit}
                                className="bg-gradient-to-r from-orange-400 to-yellow-400 hover:from-orange-500 hover:to-yellow-500 text-slate-900 font-bold py-3 px-8 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 border border-orange-300 mt-4 disabled:opacity-50 disabled:cursor-not-allowed w-full"
                                disabled={isPending || !account.address || !tokenDecimals}
                            >
                                {isPending ? "⏳ Processing..." : "🚀 Send Tokens"}
                            </button>
                        </div>
                    </div>

                    {/* Features section */}
                    <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            {
                                icon: "⚡",
                                title: "Lightning Fast",
                                description: "Batch multiple transfers in a single transaction"
                            },
                            {
                                icon: "💎",
                                title: "Gas Efficient", 
                                description: "Save up to 90% on gas fees compared to individual transfers"
                            },
                            {
                                icon: "🔒",
                                title: "Auto Decimals",
                                description: "Automatically detects token decimals - no manual conversion needed"
                            }
                        ].map((feature, index) => (
                            <div key={index} className="group text-center p-6 rounded-2xl bg-gradient-to-br from-gray-800/30 to-gray-900/30 border border-gray-700/30 hover:border-purple-500/50 transition-all duration-500 hover:shadow-lg hover:shadow-purple-500/20">
                                <div className="text-4xl mb-4">{feature.icon}</div>
                                <h3 className="text-white font-semibold text-lg mb-2">{feature.title}</h3>
                                <p className="text-gray-400">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                @keyframes fade-in-up {
                    from { 
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to { 
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                .animate-fade-in {
                    animation: fade-in 1s ease-out;
                }
                
                .animate-fade-in-up {
                    animation: fade-in-up 1s ease-out;
                }
                
                .delay-200 {
                    animation-delay: 0.2s;
                    animation-fill-mode: both;
                }
            `}</style>
        </div>
    )
}