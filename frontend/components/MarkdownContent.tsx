"use client";

import { MarkdownContentProps } from "@/lib/types/components";
import { marked, type Tokens } from "marked";
import Image from "next/image";
import { useMemo } from "react";

type MarkdownToken = Tokens.Generic;

function safeUrl(url: string | undefined) {
	if (!url) return "";
	try {
		const parsed = new URL(url, "https://example.com");
		return ["http:", "https:", "mailto:", "tel:"].includes(parsed.protocol) ? url : "";
	} catch {
		return "";
	}
}

function InlineTokens({ tokens, fallback, keyPrefix }: { tokens: MarkdownToken[] | undefined; fallback: string; keyPrefix: string }): React.ReactNode {
	if (!tokens) return fallback;

	return tokens.map((token, index) => {
		const key = `${keyPrefix}-${index}`;
		switch (token.type) {
			case "text":
			case "escape":
				return token.raw;
			case "strong":
				return (
					<strong key={key}>
						<InlineTokens tokens={token.tokens} fallback={token.text} keyPrefix={key} />
					</strong>
				);
			case "em":
				return (
					<em key={key}>
						<InlineTokens tokens={token.tokens} fallback={token.text} keyPrefix={key} />
					</em>
				);
			case "codespan":
				return <code key={key}>{token.text}</code>;
			case "br":
				return <br key={key} />;
			case "del":
				return (
					<del key={key}>
						<InlineTokens tokens={token.tokens} fallback={token.text} keyPrefix={key} />
					</del>
				);
			case "link": {
				const href = safeUrl(token.href);
				return href ? (
					<a key={key} href={href}>
						<InlineTokens tokens={token.tokens} fallback={token.text} keyPrefix={key} />
					</a>
				) : (
					<span key={key}>
						<InlineTokens tokens={token.tokens} fallback={token.text} keyPrefix={key} />
					</span>
				);
			}
			case "image": {
				const src = safeUrl(token.href);
				return src ? <Image key={key} src={src} alt={token.text || ""} title={token.title || undefined} width={800} height={450} unoptimized /> : token.text;
			}
			default:
				return "text" in token && typeof token.text === "string" ? token.text : token.raw;
		}
	});
}

function BlockTokens({ tokens, keyPrefix = "md" }: { tokens: MarkdownToken[] | undefined; keyPrefix?: string }): React.ReactNode {
	if (!tokens) return null;

	return tokens.map((token, index) => {
		const key = `${keyPrefix}-${index}`;
		switch (token.type) {
			case "heading": {
				const content = <InlineTokens tokens={token.tokens} fallback={token.text} keyPrefix={key} />;
				if (token.depth === 1) return <h1 key={key}>{content}</h1>;
				if (token.depth === 2) return <h2 key={key}>{content}</h2>;
				if (token.depth === 3) return <h3 key={key}>{content}</h3>;
				if (token.depth === 4) return <h4 key={key}>{content}</h4>;
				if (token.depth === 5) return <h5 key={key}>{content}</h5>;
				return <h6 key={key}>{content}</h6>;
			}
			case "paragraph":
				return (
					<p key={key}>
						<InlineTokens tokens={token.tokens} fallback={token.text} keyPrefix={key} />
					</p>
				);
			case "space":
				return null;
			case "hr":
				return <hr key={key} />;
			case "blockquote":
				return (
					<blockquote key={key}>
						<BlockTokens tokens={token.tokens} keyPrefix={key} />
					</blockquote>
				);
			case "list": {
				const ListTag = token.ordered ? "ol" : "ul";
				return (
					<ListTag key={key}>
						{token.items.map((item: Tokens.ListItem, itemIndex: number) => (
							<li key={`${key}-${itemIndex}`}>
								<BlockTokens tokens={item.tokens} keyPrefix={`${key}-${itemIndex}`} />
							</li>
						))}
					</ListTag>
				);
			}
			case "code":
				return (
					<pre key={key}>
						<code>{token.text}</code>
					</pre>
				);
			case "table":
				return (
					<table key={key}>
						<thead>
							<tr>
								{token.header.map((cell: Tokens.TableCell, cellIndex: number) => (
									<th key={`${key}-h-${cellIndex}`}>
										<InlineTokens tokens={cell.tokens} fallback={cell.text} keyPrefix={`${key}-h-${cellIndex}`} />
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{token.rows.map((row: Tokens.TableCell[], rowIndex: number) => (
								<tr key={`${key}-r-${rowIndex}`}>
									{row.map((cell: Tokens.TableCell, cellIndex: number) => (
										<td key={`${key}-r-${rowIndex}-${cellIndex}`}>
											<InlineTokens tokens={cell.tokens} fallback={cell.text} keyPrefix={`${key}-r-${rowIndex}-${cellIndex}`} />
										</td>
									))}
								</tr>
							))}
						</tbody>
					</table>
				);
			case "html":
				return token.text;
			default:
				return "text" in token && typeof token.text === "string" ? <p key={key}>{token.text}</p> : token.raw;
		}
	});
}

export default function MarkdownContent({ content, className = "" }: MarkdownContentProps) {
	const tokens = useMemo(() => {
		if (!content) return [];

		marked.setOptions({
			breaks: true, // Convert \n to <br>
			gfm: true, // GitHub Flavored Markdown
			pedantic: false
		});

		return marked.lexer(content) as MarkdownToken[];
	}, [content]);

	return (
		<div className={`markdown-content ${className}`}>
			<BlockTokens tokens={tokens} />
		</div>
	);
}
