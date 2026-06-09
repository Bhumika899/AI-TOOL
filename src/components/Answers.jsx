import ReactMarkdown from "react-markdown";

const Answer = ({ ans }) => {
    return (
        <div className="prose prose-invert max-w-none">
            <ReactMarkdown>{ans}</ReactMarkdown>
        </div>
    );
};

export default Answer;