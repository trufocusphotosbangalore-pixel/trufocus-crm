import { useState } from 'react'
import { Copy, Check, Code } from 'lucide-react'

interface MarkdownRendererProps {
  content: string
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const handleCopyCode = (codeText: string, index: number) => {
    navigator.clipboard.writeText(codeText)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  // Parse code blocks vs standard text
  const parts = content.split(/(```[\s\S]*?```)/g)

  return (
    <div className="space-y-3 text-xs leading-relaxed text-gray-800 font-sans">
      {parts.map((part, pIdx) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const match = part.match(/^```(\w+)?\n?([\s\S]*?)```$/)
          const lang = match?.[1] || 'text'
          const codeText = match?.[2] || ''

          return (
            <div key={pIdx} className="my-3 rounded-xl border border-gray-800 bg-[#0F172A] text-gray-100 overflow-hidden font-mono shadow-md">
              <div className="flex items-center justify-between px-4 py-2 bg-[#1B2336] border-b border-gray-800 text-[11px]">
                <span className="flex items-center gap-1.5 font-bold text-amber-400 uppercase tracking-wider">
                  <Code size={13} /> {lang}
                </span>
                <button
                  onClick={() => handleCopyCode(codeText, pIdx)}
                  className="px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white flex items-center gap-1 transition-colors cursor-pointer text-[10px]"
                >
                  {copiedIndex === pIdx ? (
                    <>
                      <Check size={12} className="text-emerald-400" />
                      <span className="text-emerald-400 font-bold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 overflow-x-auto text-[11px] leading-relaxed text-gray-200">
                <code>{codeText}</code>
              </pre>
            </div>
          )
        }

        // Standard text lines & Markdown Tables
        const lines = part.split('\n')
        const elements: React.ReactNode[] = []
        let tableBuffer: string[] = []

        const flushTable = (keyIndex: number) => {
          if (tableBuffer.length === 0) return
          const tableLines = [...tableBuffer]
          tableBuffer = []

          // Header row
          const headerRow = tableLines[0].split('|').map(s => s.trim()).filter(Boolean)
          // Data rows (skip index 1 if it's separator |---|)
          const isSeparator = tableLines[1] && tableLines[1].includes('---')
          const dataRows = (isSeparator ? tableLines.slice(2) : tableLines.slice(1)).map(rowStr =>
            rowStr.split('|').map(s => s.trim()).filter((_, i, arr) => i > 0 && i < arr.length - 0)
          )

          elements.push(
            <div key={`table-${keyIndex}`} className="my-3 overflow-x-auto rounded-xl border border-gray-200 shadow-2xs">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-[#5B3FD9]/10 text-[#5B3FD9] border-b border-gray-200 uppercase tracking-wider text-[10px] font-extrabold">
                  <tr>
                    {headerRow.map((cell, cIdx) => (
                      <th key={cIdx} className="px-3.5 py-2.5 font-extrabold">{parseInline(cell)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white font-medium">
                  {dataRows.map((r, rIdx) => (
                    <tr key={rIdx} className="hover:bg-purple-50/30 transition-colors">
                      {r.map((cell, cIdx) => (
                        <td key={cIdx} className="px-3.5 py-2">{parseInline(cell)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }

        lines.forEach((line, lIdx) => {
          const trimmed = line.trim()

          // Detect table lines
          if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
            tableBuffer.push(trimmed)
            return
          } else if (tableBuffer.length > 0) {
            flushTable(lIdx)
          }

          if (!trimmed) {
            elements.push(<div key={lIdx} className="h-1" />)
            return
          }

          // Headers (#, ##, ###)
          if (line.startsWith('# ')) {
            elements.push(<h1 key={lIdx} className="text-base font-extrabold text-[#111827] pt-2 border-b border-gray-200 pb-1">{parseInline(line.slice(2))}</h1>)
            return
          }
          if (line.startsWith('## ')) {
            elements.push(<h2 key={lIdx} className="text-sm font-extrabold text-[#111827] pt-2">{parseInline(line.slice(3))}</h2>)
            return
          }
          if (line.startsWith('### ')) {
            elements.push(<h3 key={lIdx} className="text-xs font-black text-[#5B3FD9] uppercase tracking-wider pt-1">{parseInline(line.slice(4))}</h3>)
            return
          }

          // Bullet points (•, -, *)
          if (/^[*-•]\s+/.test(trimmed)) {
            elements.push(
              <div key={lIdx} className="flex items-start gap-2 pl-2">
                <span className="text-[#5B3FD9] font-bold select-none">•</span>
                <span>{parseInline(trimmed.replace(/^[*-•]\s+/, ''))}</span>
              </div>
            )
            return
          }

          // Numbered lists (1., 2., etc.)
          if (/^\d+\.\s+/.test(trimmed)) {
            const matchNum = trimmed.match(/^(\d+)\.\s+(.*)/)
            elements.push(
              <div key={lIdx} className="flex items-start gap-2 pl-2">
                <span className="font-mono text-[10px] font-extrabold text-[#5B3FD9] bg-purple-50 px-1.5 rounded border border-purple-100 select-none">
                  {matchNum?.[1]}
                </span>
                <span>{parseInline(matchNum?.[2] || '')}</span>
              </div>
            )
            return
          }

          // Blockquotes (> )
          if (trimmed.startsWith('> ')) {
            elements.push(
              <blockquote key={lIdx} className="pl-3 py-1 border-l-3 border-[#5B3FD9] text-gray-600 bg-purple-50/50 rounded-r-lg italic my-1">
                {parseInline(trimmed.slice(2))}
              </blockquote>
            )
            return
          }

          elements.push(<p key={lIdx} className="leading-relaxed">{parseInline(line)}</p>)
        })

        if (tableBuffer.length > 0) {
          flushTable(lines.length)
        }

        return <div key={pIdx} className="space-y-1.5">{elements}</div>
      })}
    </div>
  )
}

function parseInline(text: string) {
  // Simple regex parser for **bold** and *italic* and `code`
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g)
  return parts.map((chunk, idx) => {
    if (chunk.startsWith('**') && chunk.endsWith('**')) {
      return <strong key={idx} className="font-extrabold text-[#111827]">{chunk.slice(2, -2)}</strong>
    }
    if (chunk.startsWith('*') && chunk.endsWith('*')) {
      return <em key={idx} className="italic text-gray-700">{chunk.slice(1, -1)}</em>
    }
    if (chunk.startsWith('`') && chunk.endsWith('`')) {
      return <code key={idx} className="px-1.5 py-0.5 rounded bg-gray-100 text-[#5B3FD9] font-mono text-[11px] border border-gray-200">{chunk.slice(1, -1)}</code>
    }
    return chunk
  })
}
