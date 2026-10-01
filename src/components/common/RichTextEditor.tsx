import { useEffect, useRef } from 'react'
import {
  Bold, Italic, Underline, Heading1, Heading2,
  List, ListOrdered, Link as LinkIcon, AlignLeft,
} from 'lucide-react'
import { cn } from '@/utils/cn'

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  minHeight?: string
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Write terms and conditions here...',
  minHeight = '320px',
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || ''
    }
  }, [value])

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }

  const execCommand = (command: string, arg: string | undefined = undefined) => {
    document.execCommand(command, false, arg)
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }

  const addLink = () => {
    const url = prompt('Enter URL link:', 'https://')
    if (url) {
      execCommand('createLink', url)
    }
  }

  const formatBlock = (tag: string) => {
    execCommand('formatBlock', tag)
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] overflow-hidden flex flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-[var(--color-bg-surface)] border-b border-[var(--color-border-default)]">
        <button
          type="button"
          onClick={() => formatBlock('<h1>')}
          title="Heading 1"
          className="p-1.5 rounded hover:bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          <Heading1 size={15} />
        </button>
        <button
          type="button"
          onClick={() => formatBlock('<h2>')}
          title="Heading 2"
          className="p-1.5 rounded hover:bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          <Heading2 size={15} />
        </button>
        <button
          type="button"
          onClick={() => formatBlock('<p>')}
          title="Paragraph"
          className="p-1.5 rounded hover:bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          <AlignLeft size={15} />
        </button>

        <div className="w-px h-5 bg-[var(--color-border-default)] mx-1" />

        <button
          type="button"
          onClick={() => execCommand('bold')}
          title="Bold"
          className="p-1.5 rounded hover:bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          <Bold size={15} />
        </button>
        <button
          type="button"
          onClick={() => execCommand('italic')}
          title="Italic"
          className="p-1.5 rounded hover:bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          <Italic size={15} />
        </button>
        <button
          type="button"
          onClick={() => execCommand('underline')}
          title="Underline"
          className="p-1.5 rounded hover:bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          <Underline size={15} />
        </button>

        <div className="w-px h-5 bg-[var(--color-border-default)] mx-1" />

        <button
          type="button"
          onClick={() => execCommand('insertUnorderedList')}
          title="Bullet List"
          className="p-1.5 rounded hover:bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          <List size={15} />
        </button>
        <button
          type="button"
          onClick={() => execCommand('insertOrderedList')}
          title="Numbered List"
          className="p-1.5 rounded hover:bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          <ListOrdered size={15} />
        </button>
        <button
          type="button"
          onClick={addLink}
          title="Insert Link"
          className="p-1.5 rounded hover:bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          <LinkIcon size={15} />
        </button>
      </div>

      {/* Editable Area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        style={{ minHeight }}
        data-placeholder={placeholder}
        className={cn(
          'p-4 text-sm text-[var(--color-text-primary)] focus:outline-none overflow-y-auto leading-relaxed',
          'prose prose-invert max-w-none'
        )}
      />
    </div>
  )
}
