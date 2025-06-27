// src/components/admin/RichTextEditor.tsx

"use client";

import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  Bold, Italic, Strikethrough, Code, Heading2, Heading3,
  List, ListOrdered, Quote
} from 'lucide-react';

// --- 1. The MenuBar Component ---
// This component contains all the control buttons for the editor.
const MenuBar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) {
    return null;
  }

  // A helper function to create a button
  const MenuButton = ({ onClick, isActive, children }: { onClick: () => void; isActive: boolean; children: React.ReactNode; }) => (
    <button
      type="button" // Important to prevent form submission
      onClick={onClick}
      className={`p-2 rounded-md transition-colors ${
        isActive
          ? 'bg-brand-purple text-white'
          : 'text-brand-muted hover:bg-gray-700/50'
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="flex flex-wrap items-center gap-2 p-2 bg-gray-800/50 border-b border-gray-600">
      <MenuButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')}>
        <Bold size={18} />
      </MenuButton>
      <MenuButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')}>
        <Italic size={18} />
      </MenuButton>
      <MenuButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')}>
        <Strikethrough size={18} />
      </MenuButton>
      <MenuButton onClick={() => editor.chain().focus().toggleCode().run()} isActive={editor.isActive('code')}>
        <Code size={18} />
      </MenuButton>
      
      <div className="w-px h-6 bg-gray-600 mx-2" />

      <MenuButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })}>
        <Heading2 size={18} />
      </MenuButton>
      <MenuButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive('heading', { level: 3 })}>
        <Heading3 size={18} />
      </MenuButton>
      <MenuButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')}>
        <List size={18} />
      </MenuButton>
      <MenuButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')}>
        <ListOrdered size={18} />
      </MenuButton>
      <MenuButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')}>
        <Quote size={18} />
      </MenuButton>
    </div>
  );
};


// --- 2. The Main RichTextEditor Component ---
// This integrates Tiptap's editor instance with our form.
export default function RichTextEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const editor = useEditor({
    // The extensions to use (we're using the convenient starter kit)
    extensions: [StarterKit],
    
    // The initial content for the editor
    content: value,
    
    // This function is called every time the editor's content changes.
    // We use it to update the form's state in the parent component.
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    
    // Props to pass to the underlying editor view
    editorProps: {
      attributes: {
        // Add styling to the editor's content area
        class: 'min-h-[300px] w-full p-4 bg-gray-700 text-brand-light focus:outline-none',
      },
    },
  });

  return (
    // The border wrapper for the entire editor component
    <div className="border border-gray-600 rounded-lg overflow-hidden">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}