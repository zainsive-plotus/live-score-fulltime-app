"use client";

import { useEditor, EditorContent, Editor } from "@tiptap/react";
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
} from "lucide-react";
import { useEffect } from "react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const uploadPastedImage = async (file: File, editor: Editor) => {
  const loadingToast = toast.loading("Uploading pasted image...");

  try {
    const formData = new FormData();
    formData.append("file", file);

    const { data } = await axios.post("/api/upload", formData);

    if (data.url) {
      editor.chain().focus().setImage({ src: data.url }).run();
      toast.success("Image uploaded successfully!", { id: loadingToast });
    } else {
      throw new Error("Upload failed: No URL returned from API.");
    }
  } catch (error) {
    console.error("Failed to upload pasted image:", error);
    toast.error("Failed to upload image.", { id: loadingToast });
  }
};

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3], // Only allow H2 and H3
        },
      }),
      Link.configure({ openOnClick: false, autolink: true }),
      Placeholder.configure({
        placeholder: "Write your news article content here...",
      }),
      Underline,
      Highlight.configure({ multicolor: true }),
      Typography,
      CharacterCount.configure({ limit: 100000 }),
      Image.configure({ inline: true, allowBase64: true }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        // --- MODIFIED ---
        // The editor content now only has border on the sides and bottom.
        class:
          "prose prose-invert lg:prose-xl focus:outline-none max-w-none min-h-[400px] border-x border-b border-gray-600 rounded-b-md p-4 bg-gray-800",
      },
      handlePaste: (view, event, slice) => {
        const files = event.clipboardData?.files;
        if (!files || files.length === 0) return false;
        const imageFiles = Array.from(files).filter((file) =>
          file.type.startsWith("image/")
        );
        if (imageFiles.length === 0) return false;
        event.preventDefault();
        imageFiles.forEach((file) => {
          if (view.state.editor) {
            uploadPastedImage(file, view.state.editor);
          }
        });
        return true;
      },
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, false);
    }
  }, [value, editor]);

  if (!editor) {
    return null;
  }

  return (
    // --- MODIFIED ---
    // The main container no longer has a border. It's just a wrapper.
    <div>
      {/* --- MODIFIED --- */}
      {/* The toolbar is now sticky. It sticks 2rem (32px) from the top to account for layout padding. */}
      {/* It has a solid background to prevent content from scrolling underneath it visibly. */}
      <div className="sticky top-8 z-20 flex flex-wrap items-center gap-1 p-2 border-t border-x border-gray-600 bg-brand-secondary rounded-t-md">
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
