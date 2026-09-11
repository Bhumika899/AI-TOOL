import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { useState } from "react";
import CodeBlock from "./CodeBlock";

const Answer = ({ ans, theme }) => {
    const [copied, setCopied] = useState(false);

    const copyToClipboard = () => {
        if (!ans) return;
        navigator.clipboard.writeText(ans);
        setCopied(true);

        setTimeout(() => {
            setCopied(false);
        }, 2000);
    };

    const isDark = theme === "dark";

    return (
        <div className="w-full relative">
            {/* Top Copy Button */}
            <div className="flex justify-end mb-2">
                <button
                    onClick={copyToClipboard}
                    className={`px-3 py-1 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${copied
                            ? "bg-emerald-500 text-white shadow-sm"
                            : isDark
                                ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900 border border-gray-200"
                        }`}
                    title="Copy full answer"
                >
                    {copied ? (
                        <>
                            <span>✓</span> Copied
                        </>
                    ) : (
                        <>
                            <span>📋</span> Copy
                        </>
                    )}
                </button>
            </div>

            {/* Markdown Content Output */}
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={{
                    // Code & Syntax Highlighting
                    code({ inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || "");
                        const codeString = String(children).replace(/\n$/, "");

                        return !inline && match ? (
                            <div className="my-3">
                                <CodeBlock language={match[1]} value={codeString} />
                            </div>
                        ) : (
                            <code
                                className={`px-1.5 py-0.5 rounded font-mono text-xs ${isDark
                                        ? "bg-zinc-800 text-amber-300 border border-zinc-700/60"
                                        : "bg-gray-100 text-amber-800 border border-gray-300/60"
                                    }`}
                                {...props}
                            >
                                {children}
                            </code>
                        );
                    },

                    // Headings
                    h1: ({ children }) => (
                        <h1
                            className={`text-2xl md:text-3xl font-bold mt-4 mb-3 tracking-tight ${isDark ? "text-zinc-100" : "text-zinc-900"
                                }`}
                        >
                            {children}
                        </h1>
                    ),
                    h2: ({ children }) => (
                        <h2
                            className={`text-xl md:text-2xl font-semibold mt-4 mb-2 tracking-tight ${isDark ? "text-zinc-100" : "text-zinc-900"
                                }`}
                        >
                            {children}
                        </h2>
                    ),
                    h3: ({ children }) => (
                        <h3
                            className={`text-lg font-semibold mt-3 mb-1.5 ${isDark ? "text-zinc-200" : "text-zinc-800"
                                }`}
                        >
                            {children}
                        </h3>
                    ),

                    // Paragraphs & Text
                    p: ({ children }) => (
                        <p
                            className={`mb-3 leading-relaxed text-sm md:text-base ${isDark ? "text-zinc-200" : "text-zinc-800"
                                }`}
                        >
                            {children}
                        </p>
                    ),

                    // Lists
                    ul: ({ children }) => (
                        <ul
                            className={`list-disc list-outside ml-6 mb-3 space-y-1 text-sm md:text-base ${isDark ? "text-zinc-200" : "text-zinc-800"
                                }`}
                        >
                            {children}
                        </ul>
                    ),
                    ol: ({ children }) => (
                        <ol
                            className={`list-decimal list-outside ml-6 mb-3 space-y-1 text-sm md:text-base ${isDark ? "text-zinc-200" : "text-zinc-800"
                                }`}
                        >
                            {children}
                        </ol>
                    ),
                    li: ({ children }) => <li className="leading-relaxed">{children}</li>,

                    // Blockquotes
                    blockquote: ({ children }) => (
                        <blockquote
                            className={`pl-4 py-1 my-3 border-l-4 rounded-r-lg text-sm italic ${isDark
                                    ? "border-blue-500 bg-blue-500/10 text-zinc-300"
                                    : "border-blue-600 bg-blue-50 text-zinc-700"
                                }`}
                        >
                            {children}
                        </blockquote>
                    ),

                    // Tables
                    table: ({ children }) => (
                        <div className="overflow-x-auto my-4 rounded-xl border border-zinc-700/50">
                            <table
                                className={`w-full text-left border-collapse text-xs md:text-sm ${isDark ? "text-zinc-200" : "text-zinc-800"
                                    }`}
                            >
                                {children}
                            </table>
                        </div>
                    ),
                    thead: ({ children }) => (
                        <thead
                            className={
                                isDark
                                    ? "bg-zinc-800/80 border-b border-zinc-700"
                                    : "bg-gray-100 border-b border-gray-300"
                            }
                        >
                            {children}
                        </thead>
                    ),
                    th: ({ children }) => (
                        <th className="px-3 py-2 font-semibold">{children}</th>
                    ),
                    td: ({ children }) => (
                        <td
                            className={`px-3 py-2 border-t ${isDark ? "border-zinc-800" : "border-gray-200"
                                }`}
                        >
                            {children}
                        </td>
                    ),
                }}
            >
                {ans}
            </ReactMarkdown>
        </div>
    );
};

export default Answer;