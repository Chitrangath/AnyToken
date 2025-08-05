import { useState } from "react";

export default interface InputFormProps {
    label: string
    placeholder: string
    value?: string
    type?: string
    large?: boolean
    onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
}

export function InputForm({ label, placeholder, value, type, large, onChange }: InputFormProps) {
    const [focused, setFocused] = useState(false);

    return (
        <div className="group relative">
            <label className="block text-sm font-semibold text-gray-300 mb-3 transition-colors duration-300">
                {label}
            </label>
            <div className="relative">
                {large ? (
                    <textarea
                        className={`w-full h-32 px-4 py-4 bg-gray-800/50 border rounded-xl text-white placeholder-gray-400 backdrop-blur-sm transition-all duration-300 resize-none
                            ${focused 
                                ? 'border-purple-500 shadow-lg shadow-purple-500/25 bg-gray-800/80' 
                                : 'border-gray-600/50 hover:border-gray-500/70'
                            }`}
                        placeholder={placeholder}
                        value={value || ''}
                        onChange={onChange}
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}
                    />
                ) : (
                    <input
                        className={`w-full px-4 py-4 bg-gray-800/50 border rounded-xl text-white placeholder-gray-400 backdrop-blur-sm transition-all duration-300
                            ${focused 
                                ? 'border-purple-500 shadow-lg shadow-purple-500/25 bg-gray-800/80' 
                                : 'border-gray-600/50 hover:border-gray-500/70'
                            }`}
                        type={type}
                        placeholder={placeholder}
                        value={value || ''}
                        onChange={onChange}
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}
                    />
                )}
                {/* Animated border glow */}
                <div className={`absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/20 to-blue-500/20 blur-sm transition-opacity duration-300 -z-10 ${
                    focused ? 'opacity-100' : 'opacity-0'
                }`}></div>
            </div>
        </div>
    );
}