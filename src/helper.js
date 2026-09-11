export function checkHeading(str) {
    return /^\*\*(.*?)\*\*$/.test(str.trim());
}

export function replaceHeadingStarts(str) {
    return str.replace(/^\*\*(.*?)\*\*$/, "$1");
}