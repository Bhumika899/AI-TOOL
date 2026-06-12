import ReactMarkdown from "react-markdown";

const Answer = ({ ans }) => {
    return (
        <ReactMarkdown
            components={{
                h1: ({ children }) => (
                    <h1 className="text-3xl font-bold text-white mb-4">
                        {children}
                    </h1>
                ),
                h2: ({ children }) => (
                    <h2 className="text-2xl font-bold text-white mb-3">
                        {children}
                    </h2>
                ),
                ul: ({ children }) => (
                    <ul className="list-disc ml-6 text-white mb-4">
                        {children}
                    </ul>
                ),
                li: ({ children }) => (
                    <li className="mb-2">{children}</li>
                ),
                p: ({ children }) => (
                    <p className="text-white mb-2">{children}</p>
                ),
            }}
        >
            {ans}
        </ReactMarkdown>
    );
};

export default Answer;