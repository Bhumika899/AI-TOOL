import { useState } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

function CodeBlock({
    language,
    value,
}) {
    const [copied, setCopied] =
        useState(false);

    return (
        <div className="rounded-xl overflow-hidden border border-zinc-700 my-4">
            <div className="flex justify-between items-center bg-zinc-900 px-4 py-2">
                <span className="text-zinc-400 text-sm">
                    {language}
                </span>

                <CopyToClipboard
                    text={value}
                    onCopy={() => {
                        setCopied(true);

                        setTimeout(() => {
                            setCopied(false);
                        }, 2000);
                    }}
                >
                    <button className="text-xs text-white bg-zinc-700 px-3 py-1 rounded">
                        {copied
                            ? "Copied!"
                            : "Copy"}
                    </button>
                </CopyToClipboard>
            </div>

            <SyntaxHighlighter
                language={language}
                style={vscDarkPlus}
                customStyle={{
                    margin: 0,
                }}
            >
                {value}
            </SyntaxHighlighter>
        </div>
    );
}

export default CodeBlock;