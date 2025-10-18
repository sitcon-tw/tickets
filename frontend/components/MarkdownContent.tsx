"use client";

import { marked } from "marked";
import { useMemo } from "react";

interface MarkdownContentProps {
	content: string;
	className?: string;
}

export default function MarkdownContent({ content, className = "" }: MarkdownContentProps) {
	const html = useMemo(() => {
		if (!content) return "";

		marked.setOptions({
			breaks: true, // Convert \n to <br>
			gfm: true, // GitHub Flavored Markdown
			pedantic: false
		});

		return marked(content, { async: false }) as string;
	}, [content]);

	return <div className={`markdown-content ${className}`} dangerouslySetInnerHTML={{ __html: html }} />;
}
