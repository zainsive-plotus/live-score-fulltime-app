// ===== src/components/admin/RichTextEditor.tsx =====

"use client";

import { useEditor, EditorContent, Editor, BubbleMenu } from "@tiptap/react"; // MODIFIED: Imported BubbleMenu
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import Typography from "@tiptap/extension-typography";
import CharacterCount from "@tiptap/extension-character-count";
import Image from "@tiptap/extension-image";
import axios from "axios";
import toast from "react-hot-toast";

import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  Quote,
  Minus,
  Link as LinkIcon,
  Image as ImageIcon,
  Pilcrow,
} from "lucide-react";
import { useEffect, useCallback } from "react"; // MODIFIED: Imported useCallback

const CustomImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      alt: {
        default: null,
        parseHTML: (element) => element.getAttribute("alt"),
        renderHTML: (attributes) => {
          if (!attributes.alt) {
            return {};
          }
          return { alt: attributes.alt };
        },
      },
    };
  },
});

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const uploadPastedImage = async (file: File, editor: Editor) => {
  // ... (This function remains the same)
};

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Link.configure({ openOnClick: false, autolink: true }),
      Placeholder.configure({
        placeholder: "Write your news article content here...",
      }),
      Underline,
      Highlight.configure({ multicolor: true }),
      Typography,
      CharacterCount.configure({ limit: 100000 }),
      CustomImage.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: { class: "rounded-lg cursor-pointer" }, // Added cursor-pointer
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-invert lg:prose-xl focus:outline-none max-w-none min-h-[400px] border-x border-b border-gray-600 rounded-b-md p-4 bg-gray-800",
      },
      handlePaste: (view, event, slice) => {
        /* ... */
      },
    },
  });

  // MODIFIED: Wrapped in useCallback for performance
  const addImage = useCallback(() => {
    const url = window.prompt("Image URL");
    if (url) {
      const altText = window.prompt("Image Alt Text (Description)");
      editor
        ?.chain()
        .focus()
        .setImage({ src: url, alt: altText || "" })
        .run();
    }
  }, [editor]);

  useEffect(() => {
    if (editor && !editor.isDestroyed && value !== editor.getHTML()) {
      editor.commands.setContent(value, false);
    }
  }, [value, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div>
      {/* --- NEW: Bubble Menu for Image Editing --- */}
      {editor && (
        <BubbleMenu
          editor={editor}
          tippyOptions={{ duration: 100 }}
          // This function determines when the menu should appear
          shouldShow={({ editor }) => editor.isActive("image")}
          className="bg-brand-dark border border-gray-600 rounded-lg shadow-xl p-2 flex items-center gap-2"
        >
          <input
            type="text"
            // Get the current alt text of the selected image
            value={editor.getAttributes("image").alt || ""}
            // Update the alt attribute on change
            onChange={(e) =>
              editor
                .chain()
                .focus()
                .updateAttributes("image", { alt: e.target.value })
                .run()
            }
            placeholder="Enter alt text..."
            className="bg-gray-700 text-white text-sm p-1 rounded-md outline-none focus:ring-2 focus:ring-brand-purple"
          />
        </BubbleMenu>
      )}
      {/* --- END of Bubble Menu --- */}

      <div className="sticky top-8 z-20 flex flex-wrap items-center gap-1 p-2 border-t border-x border-gray-600 bg-brand-secondary rounded-t-md">
        {/* ... (all toolbar buttons remain the same) ... */}
        <button
          type="button"
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
          type="button"
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
          type="button"
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
          type="button"
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
          type="button"
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
          type="button"
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
          type="button"
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
          type="button"
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
          type="button"
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
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className={`p-2 rounded text-brand-muted hover:bg-gray-600`}
        >
          <Minus size={18} />
        </button>
        <button
          type="button"
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
          type="button"
          onClick={addImage}
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
