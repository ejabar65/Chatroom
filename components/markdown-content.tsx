"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkBreaks from "remark-breaks"

interface MarkdownContentProps {
  content: string
  className?: string
}

export function MarkdownContent({ content, className = "" }: MarkdownContentProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkBreaks]}
      className={`prose prose-sm dark:prose-invert max-w-none ${className}`}
      components={{
        // Customize rendering of specific elements
        h1: ({ children }) => <h1 className="text-2xl font-bold mb-4">{children}</h1>,
        h2: ({ children }) => <h2 className="text-xl font-bold mb-3">{children}</h2>,
        h3: ({ children }) => <h3 className="text-lg font-semibold mb-2">{children}</h3>,
        p: ({ children }) => <p className="mb-3 text-pretty">{children}</p>,
        ul: ({ children }) => <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>,
        li: ({ children }) => <li className="ml-4">{children}</li>,
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-primary pl-4 italic my-3 text-muted-foreground">
            {children}
          </blockquote>
        ),
        code: ({ inline, children }: any) =>
          inline ? (
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>
          ) : (
            <code className="block bg-muted p-3 rounded-lg my-3 overflow-x-auto font-mono text-sm">
              {children}
            </code>
          ),
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            {children}
          </a>
        ),
        strong: ({ children }) => <strong className="font-bold">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
      }}
    >
      {content}
    </ReactMarkdown>
  )
}
