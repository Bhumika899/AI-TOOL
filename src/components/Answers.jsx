import ReactMarkdown from "react-markdown";
import { useState } from "react";
import CodeBlock from "./CodeBlock";
// import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
// import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

const Answer = ({ ans, theme }) => {

    const [copied, setCopied] = useState(false);
    const copyToClipboard = () => {
        console.log("BUTTON CLICKED");
        navigator.clipboard.writeText(ans);

        setCopied(true);
        alert("Copied!");

        setTimeout(() => {
            setCopied(false);
        }, 2000);
    };
    return (
        <div>
            <div className="flex justify-end mb-2">
                <button
                    onClick={copyToClipboard}
                    className={`px-3 py-1 rounded text-sm ${copied
                        ? "bg-green-500 text-white"
                        : theme === "dark"
                            ? "bg-zinc-700 text-white"
                            : "bg-gray-200 text-black"
                        }`}
                >
                    {copied ? "✓ Copied" : "📋 Copy"}
                </button>
            </div>
            <ReactMarkdown
                components={{
                    code({ inline, className, children }) {
                        const match = /language-(\w+)/.exec(
                            className || ""
                        );

                        return !inline && match ? (
                            <CodeBlock
                                language={match[1]}
                                value={String(children).replace(/\n$/, "")}
                            />
                        ) : (
                            <code
                                className={`px-1 py-0.5 rounded ${theme === "dark"
                                    ? "bg-zinc-700 text-white"
                                    : "bg-gray-200 text-black"
                                    }`}
                            >
                                {children}
                            </code>
                        );
                    },

                    h1: ({ children }) => (
                        <h1
                            className={`text-3xl font-bold mb-4 ${theme === "dark"
                                ? "text-white"
                                : "text-black"
                                }`}
                        >
                            {children}
                        </h1>
                    ),

                    h2: ({ children }) => (
                        <h2
                            className={`text-2xl font-bold mb-3 ${theme === "dark"
                                ? "text-white"
                                : "text-black"
                                }`}
                        >
                            {children}
                        </h2>
                    ),

                    ul: ({ children }) => (
                        <ul
                            className={`list-disc ml-6 mb-4 ${theme === "dark"
                                ? "text-white"
                                : "text-black"
                                }`}
                        >
                            {children}
                        </ul>
                    ),

                    li: ({ children }) => (
                        <li className="mb-2">{children}</li>
                    ),

                    p: ({ children }) => (
                        <p
                            className={`mb-2 ${theme === "dark"
                                ? "text-white"
                                : "text-black"
                                }`}
                        >
                            {children}
                        </p>
                    ),
                }}
            >
                {ans}
            </ReactMarkdown>
        </div>
    );
};

export default Answer;