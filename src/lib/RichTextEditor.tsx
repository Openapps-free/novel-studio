import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Typography from "@tiptap/extension-typography";
import Highlight from "@tiptap/extension-highlight";
import { useEffect, useMemo } from "react";

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  typewriterMode?: boolean;
  fontSize?: number;
  lineHeight?: number;
  dyslexiaFriendly?: boolean;
  theme?: "dark" | "light" | "sepia";
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function countChars(text: string): number {
  return text.replace(/\s/g, "").length;
}

function formatReadingTime(words: number): string {
  const minutes = Math.ceil(words / 200);
  return `${minutes} min read`;
}

function EditorToolbar({ editor }: { editor: ReturnType<typeof useEditor> }) {
  if (!editor) return null;

  const buttons = [
    {
      icon: "B",
      title: "Bold (Ctrl+B)",
      action: () => editor.chain().focus().toggleBold().run(),
      active: editor.isActive("bold"),
    },
    {
      icon: "I",
      title: "Italic (Ctrl+I)",
      action: () => editor.chain().focus().toggleItalic().run(),
      active: editor.isActive("italic"),
      className: "italic",
    },
    {
      icon: "S",
      title: "Strikethrough",
      action: () => editor.chain().focus().toggleStrike().run(),
      active: editor.isActive("strike"),
      className: "strike",
    },
    { type: "divider" },
    {
      icon: "H1",
      title: "Heading 1",
      action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      active: editor.isActive("heading", { level: 1 }),
    },
    {
      icon: "H2",
      title: "Heading 2",
      action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      active: editor.isActive("heading", { level: 2 }),
    },
    {
      icon: "H3",
      title: "Heading 3",
      action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      active: editor.isActive("heading", { level: 3 }),
    },
    { type: "divider" },
    {
      icon: "•",
      title: "Bullet List",
      action: () => editor.chain().focus().toggleBulletList().run(),
      active: editor.isActive("bulletList"),
    },
    {
      icon: "1.",
      title: "Numbered List",
      action: () => editor.chain().focus().toggleOrderedList().run(),
      active: editor.isActive("orderedList"),
    },
    {
      icon: "❝",
      title: "Blockquote",
      action: () => editor.chain().focus().toggleBlockquote().run(),
      active: editor.isActive("blockquote"),
    },
    { type: "divider" },
    {
      icon: "🖍",
      title: "Highlight Yellow",
      action: () => editor.chain().focus().toggleHighlight({ color: "#fef08a" }).run(),
      active: editor.isActive("highlight", { color: "#fef08a" }),
      className: "highlight-yellow",
    },
    {
      icon: "🖍",
      title: "Highlight Green",
      action: () => editor.chain().focus().toggleHighlight({ color: "#bbf7d0" }).run(),
      active: editor.isActive("highlight", { color: "#bbf7d0" }),
      className: "highlight-green",
    },
    {
      icon: "🖍",
      title: "Highlight Blue",
      action: () => editor.chain().focus().toggleHighlight({ color: "#bfdbfe" }).run(),
      active: editor.isActive("highlight", { color: "#bfdbfe" }),
      className: "highlight-blue",
    },
    {
      icon: "🖍",
      title: "Highlight Pink",
      action: () => editor.chain().focus().toggleHighlight({ color: "#fbcfe8" }).run(),
      active: editor.isActive("highlight", { color: "#fbcfe8" }),
      className: "highlight-pink",
    },
    {
      icon: "✕",
      title: "Remove Highlight",
      action: () => editor.chain().focus().unsetHighlight().run(),
      active: false,
      className: "highlight-remove",
    },
    { type: "divider" },
    {
      icon: "←",
      title: "Undo (Ctrl+Z)",
      action: () => editor.chain().focus().undo().run(),
      disabled: !editor.can().undo(),
    },
    {
      icon: "→",
      title: "Redo (Ctrl+Y)",
      action: () => editor.chain().focus().redo().run(),
      disabled: !editor.can().redo(),
    },
  ];

  return (
    <div className="editor-toolbar">
      {buttons.map((btn, i) =>
        btn.type === "divider" ? (
          <div key={i} className="toolbar-divider" />
        ) : (
          <button
            key={i}
            type="button"
            title={btn.title}
            className={`toolbar-btn ${btn.active ? "active" : ""} ${btn.className || ""} ${btn.disabled ? "disabled" : ""}`}
            onClick={btn.action}
            disabled={btn.disabled}
          >
            {btn.icon}
          </button>
        )
      )}
    </div>
  );
}

export default function RichTextEditor({
  content,
  onChange,
  placeholder = "Start writing your scene...",
  typewriterMode = false,
  fontSize = 18,
  lineHeight = 1.9,
  dyslexiaFriendly = false,
  theme = "dark",
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Typography,
      Highlight.configure({
        multicolor: true,
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose-input",
      },
    },
  });

  const plainText = useMemo(() => {
    if (!editor) return "";
    return editor.getText();
  }, [editor]);

  const wordCount = useMemo(() => countWords(plainText), [plainText]);
  const charCount = useMemo(() => countChars(plainText), [plainText]);
  const readingTime = useMemo(() => formatReadingTime(wordCount), [wordCount]);

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  useEffect(() => {
    if (!editor || !typewriterMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === "Backspace") {
        return;
      }
      const editorEl = document.querySelector(".ProseMirror");
      if (!editorEl) return;

      const rect = editorEl.getBoundingClientRect();
      const cursorY = window.scrollY + rect.top + rect.height / 2;
      const windowCenter = window.scrollY + window.innerHeight / 2;

      if (Math.abs(cursorY - windowCenter) > 50) {
        const scrollAmount = cursorY - windowCenter;
        window.scrollBy({ top: scrollAmount * 0.5, behavior: "smooth" });
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [editor, typewriterMode]);

  const editorStyles = {
    fontSize: `${fontSize}px`,
    lineHeight: lineHeight,
    fontFamily: dyslexiaFriendly 
      ? "'OpenDyslexic', 'Comic Sans MS', sans-serif" 
      : undefined,
  };

  const themeClass = `theme-${theme}`;

  return (
    <div className={`rich-editor ${themeClass}`}>
      <EditorToolbar editor={editor} />
      <div className={`editor-content-wrapper ${typewriterMode ? "typewriter" : ""}`} style={editorStyles}>
        <EditorContent editor={editor} />
      </div>
      <div className="editor-footer">
        <div className="editor-stats">
          <span>{wordCount.toLocaleString()} words</span>
          <span className="stat-divider">|</span>
          <span>{charCount.toLocaleString()} chars</span>
          <span className="stat-divider">|</span>
          <span>{readingTime}</span>
        </div>
      </div>
    </div>
  );
}
