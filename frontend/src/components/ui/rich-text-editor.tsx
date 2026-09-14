'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, List, ListOrdered } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ content, onChange, placeholder = "Füge eine Beschreibung hinzu..." }: RichTextEditorProps) {
  const isInternalChange = useRef(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'cursor-text before:content-[attr(data-placeholder)] before:absolute before:text-muted-foreground before:pointer-events-none',
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[150px] text-foreground text-sm leading-relaxed p-4',
      },
    },
    onUpdate: ({ editor }) => {
      isInternalChange.current = true;
      onChange(editor.getHTML());
    },
  });

  // Update content if changed from outside
  useEffect(() => {
    // Only set content if the change came from OUTSIDE (parent prop change)
    // and not from our own onUpdate
    if (!isInternalChange.current) {
      const currentContent = editor?.getHTML() || '';
      if (content !== currentContent) {
        editor?.commands.setContent(content);
      }
    }
    isInternalChange.current = false;
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="rounded-xl border border-border bg-card/50 overflow-hidden focus-within:border-indigo-500/50 transition-colors">
      <div className="flex items-center gap-1 border-b border-border bg-background/50 p-2">
        <button
          onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleBold().run(); }}
          className={`p-1.5 rounded-md transition-colors ${editor.isActive('bold') ? 'bg-muted text-white' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'}`}
        >
          <Bold size={16} />
        </button>
        <button
          onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleItalic().run(); }}
          className={`p-1.5 rounded-md transition-colors ${editor.isActive('italic') ? 'bg-muted text-white' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'}`}
        >
          <Italic size={16} />
        </button>
        <div className="w-px h-4 bg-muted mx-1"></div>
        <button
          onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleBulletList().run(); }}
          className={`p-1.5 rounded-md transition-colors ${editor.isActive('bulletList') ? 'bg-muted text-white' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'}`}
        >
          <List size={16} />
        </button>
        <button
          onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleOrderedList().run(); }}
          className={`p-1.5 rounded-md transition-colors ${editor.isActive('orderedList') ? 'bg-muted text-white' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'}`}
        >
          <ListOrdered size={16} />
        </button>
      </div>
      <EditorContent editor={editor} className="relative" />
    </div>
  );
}
