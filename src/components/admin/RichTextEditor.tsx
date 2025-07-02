// src/components/admin/RichTextEditor.tsx
"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import Typography from "@tiptap/extension-typography";
import CharacterCount from "@tiptap/extension-character-count";
import Image from "@tiptap/extension-image";

import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Minus,
  Undo,
  Redo,
  Link as LinkIcon,
  Image as ImageIcon,
} from "lucide-react";
import { useEffect } from "react";

interface RichTextEditorProps {
  value: string; // Now expects HTML string
  onChange: (value: string) => void; // Will output HTML string
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Default StarterKit config is fine for HTML output
        // You might consider customizing headings, lists if needed
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
      Placeholder.configure({
        placeholder: "Write your news article content here...",
      }),
      Underline,
      Highlight.configure({
        multicolor: true,
      }),
      Typography,
      CharacterCount.configure({
        limit: 100000,
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
    ],
    // Tiptap natively accepts HTML for 'content'
    content: value,
    onUpdate: ({ editor }) => {
      // When content updates, export it as HTML and pass to onChange
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-invert lg:prose-xl focus:outline-none max-w-none min-h-[300px] border border-gray-600 rounded-b-md p-4 bg-gray-800",
      },
    },
  });

  // Effect to update editor content when 'value' prop changes externally
  useEffect(() => {
    // Only update if the new value is different from current editor HTML content
    // and editor is initialized.
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, false); // Set content, 'false' means don't create a new history entry
    }
  }, [value, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="border border-gray-600 rounded-md">
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-600 bg-gray-700 rounded-t-md">
        {/* Formatting buttons remain the same, they operate on rich text */}
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={`p-2 rounded ${
            editor.isActive("bold")
              ? "bg-brand-purple text-white"
              : "text-brand-muted hover:bg-gray-600"
          }`}
        >
          <Bold size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={`p-2 rounded ${
            editor.isActive("italic")
              ? "bg-brand-purple text-white"
              : "text-brand-muted hover:bg-gray-600"
          }`}
        >
          <Italic size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={!editor.can().chain().focus().toggleStrike().run()}
          className={`p-2 rounded ${
            editor.isActive("strike")
              ? "bg-brand-purple text-white"
              : "text-brand-muted hover:bg-gray-600"
          }`}
        >
          <Strikethrough size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleCode().run()}
          disabled={!editor.can().chain().focus().toggleCode().run()}
          className={`p-2 rounded ${
            editor.isActive("code")
              ? "bg-brand-purple text-white"
              : "text-brand-muted hover:bg-gray-600"
          }`}
        >
          <Code size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          disabled={!editor.can().chain().focus().toggleBulletList().run()}
          className={`p-2 rounded ${
            editor.isActive("bulletList")
              ? "bg-brand-purple text-white"
              : "text-brand-muted hover:bg-gray-600"
          }`}
        >
          <List size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          disabled={!editor.can().chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded ${
            editor.isActive("orderedList")
              ? "bg-brand-purple text-white"
              : "text-brand-muted hover:bg-gray-600"
          }`}
        >
          <ListOrdered size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().setParagraph().run()}
          className={`p-2 rounded ${
            editor.isActive("paragraph")
              ? "bg-brand-purple text-white"
              : "text-brand-muted hover:bg-gray-600"
          }`}
        >
          {/* <Paragraph size={18} /> */}
        </button>
        <button
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          className={`p-2 rounded ${
            editor.isActive("heading", { level: 1 })
              ? "bg-brand-purple text-white"
              : "text-brand-muted hover:bg-gray-600"
          }`}
        >
          <Heading1 size={18} />
        </button>
        <button
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          className={`p-2 rounded ${
            editor.isActive("heading", { level: 2 })
              ? "bg-brand-purple text-white"
              : "text-brand-muted hover:bg-gray-600"
          }`}
        >
          <Heading2 size={18} />
        </button>
        <button
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          className={`p-2 rounded ${
            editor.isActive("heading", { level: 3 })
              ? "bg-brand-purple text-white"
              : "text-brand-muted hover:bg-gray-600"
          }`}
        >
          <Heading3 size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-2 rounded ${
            editor.isActive("blockquote")
              ? "bg-brand-purple text-white"
              : "text-brand-muted hover:bg-gray-600"
          }`}
        >
          <Quote size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className={`p-2 rounded text-brand-muted hover:bg-gray-600`}
        >
          <Minus size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className={`p-2 rounded text-brand-muted hover:bg-gray-600`}
        >
          <Undo size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className={`p-2 rounded text-brand-muted hover:bg-gray-600`}
        >
          <Redo size={18} />
        </button>
        <button
          onClick={() => {
            const url = window.prompt("URL");
            if (url) {
              editor.chain().focus().setLink({ href: url }).run();
            }
          }}
          className={`p-2 rounded ${
            editor.isActive("link")
              ? "bg-brand-purple text-white"
              : "text-brand-muted hover:bg-gray-600"
          }`}
        >
          <LinkIcon size={18} />
        </button>
        <button
          onClick={() => {
            const url = window.prompt("Image URL");
            if (url) {
              editor.chain().focus().setImage({ src: url }).run();
            }
          }}
          className={`p-2 rounded text-brand-muted hover:bg-gray-600`}
        >
          <ImageIcon size={18} />
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
};

export default RichTextEditor;
