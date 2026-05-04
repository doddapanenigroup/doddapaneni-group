'use client';

import { useEffect, useId, useMemo, useRef } from 'react';
import { plainTextPasteToListHtml } from '@/lib/tiptap-plain-text-list-paste';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import type { Editor } from '@tiptap/core';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Pilcrow,
  Quote,
  Redo2,
  Strikethrough,
  Type,
  Underline,
  Undo2,
} from 'lucide-react';
import { BlogFontSize } from '@/lib/tiptap-blog-font-size';
import { dashboardIconButtonClass, dashboardInputClass, dashboardNestedCardClass } from '@/lib/dashboard-ui';

const labelClass =
  'mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400';

const toolbarBtn = `${dashboardIconButtonClass} !h-9 !min-h-0 !w-9 !min-w-9 shrink-0 px-0 disabled:opacity-40`;

const toolbarBtnActive =
  'border-violet-400 bg-violet-50 text-violet-900 ring-1 ring-violet-300/60 dark:border-violet-600 dark:bg-violet-950/50 dark:text-violet-100 dark:ring-violet-800/50';

const toolbarSelect = `h-9 w-auto min-w-0 px-2 py-1.5 text-sm ${dashboardInputClass}`;

function normalizeEmptyHtml(html: string): string {
  const t = html.trim();
  if (t === '' || t === '<p></p>' || t === '<p><br></p>' || t === '<p><br class="ProseMirror-trailingBreak"></p>') {
    return '';
  }
  return html;
}

function isHtmlEffectivelyEqual(a: string, b: string): boolean {
  return normalizeEmptyHtml(a) === normalizeEmptyHtml(b);
}

function BlogEditorToolbar({ editor, minHeightClass }: { editor: Editor; minHeightClass: string }) {
  const setLink = () => {
    const prev = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Link URL', prev?.trim() || 'https://');
    if (url === null) return;
    const t = url.trim();
    if (t === '') editor.chain().focus().extendMarkRange('link').unsetLink().run();
    else editor.chain().focus().extendMarkRange('link').setLink({ href: t }).run();
  };

  const fontSize = (editor.getAttributes('blogFontSize') as { size?: string }).size ?? '';

  const alignActive = (a: 'left' | 'center' | 'right' | 'justify') =>
    editor.isActive({ textAlign: a }) === true;

  return (
    <div className={`blog-rich-editor flex flex-col overflow-hidden !p-0 shadow-sm ${dashboardNestedCardClass}`}>
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50/90 px-2 py-2 dark:border-slate-700 dark:bg-slate-800/80">
        <button
          type="button"
          className={`${toolbarBtn} ${editor.isActive('bold') ? toolbarBtnActive : ''}`}
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().toggleBold()}
          title="Bold (Ctrl+B)"
        >
          <Bold className="h-4 w-4" strokeWidth={2.25} aria-hidden />
        </button>
        <button
          type="button"
          className={`${toolbarBtn} ${editor.isActive('italic') ? toolbarBtnActive : ''}`}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().toggleItalic()}
          title="Italic (Ctrl+I)"
        >
          <Italic className="h-4 w-4" strokeWidth={2.25} aria-hidden />
        </button>
        <button
          type="button"
          className={`${toolbarBtn} ${editor.isActive('underline') ? toolbarBtnActive : ''}`}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="Underline (Ctrl+U)"
        >
          <Underline className="h-4 w-4" strokeWidth={2.25} aria-hidden />
        </button>
        <button
          type="button"
          className={`${toolbarBtn} ${editor.isActive('strike') ? toolbarBtnActive : ''}`}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          title="Strikethrough"
        >
          <Strikethrough className="h-4 w-4" strokeWidth={2.25} aria-hidden />
        </button>

        <span className="mx-0.5 hidden h-6 w-px bg-slate-200 sm:inline dark:bg-slate-600" aria-hidden />

        <button
          type="button"
          className={`${toolbarBtn} ${editor.isActive('heading', { level: 1 }) ? toolbarBtnActive : ''}`}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          title="Heading 1"
        >
          <Heading1 className="h-4 w-4" strokeWidth={2.25} aria-hidden />
        </button>
        <button
          type="button"
          className={`${toolbarBtn} ${editor.isActive('heading', { level: 2 }) ? toolbarBtnActive : ''}`}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title="Heading 2"
        >
          <Heading2 className="h-4 w-4" strokeWidth={2.25} aria-hidden />
        </button>
        <button
          type="button"
          className={`${toolbarBtn} ${editor.isActive('heading', { level: 3 }) ? toolbarBtnActive : ''}`}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          title="Heading 3"
        >
          <Heading3 className="h-4 w-4" strokeWidth={2.25} aria-hidden />
        </button>
        <button
          type="button"
          className={toolbarBtn}
          onClick={() => editor.chain().focus().setParagraph().run()}
          title="Normal text"
        >
          <Pilcrow className="h-4 w-4" strokeWidth={2.25} aria-hidden />
        </button>

        <span className="mx-0.5 hidden h-6 w-px bg-slate-200 sm:inline dark:bg-slate-600" aria-hidden />

        <button
          type="button"
          className={`${toolbarBtn} ${editor.isActive('bulletList') ? toolbarBtnActive : ''}`}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bulleted list"
        >
          <List className="h-4 w-4" strokeWidth={2.25} aria-hidden />
        </button>
        <button
          type="button"
          className={`${toolbarBtn} ${editor.isActive('orderedList') ? toolbarBtnActive : ''}`}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Numbered list"
        >
          <ListOrdered className="h-4 w-4" strokeWidth={2.25} aria-hidden />
        </button>
        <button
          type="button"
          className={`${toolbarBtn} ${editor.isActive('blockquote') ? toolbarBtnActive : ''}`}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title="Quote"
        >
          <Quote className="h-4 w-4" strokeWidth={2.25} aria-hidden />
        </button>

        <span className="mx-0.5 hidden h-6 w-px bg-slate-200 sm:inline dark:bg-slate-600" aria-hidden />

        <button
          type="button"
          className={`${toolbarBtn} ${alignActive('left') ? toolbarBtnActive : ''}`}
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          title="Align left"
        >
          <AlignLeft className="h-4 w-4" strokeWidth={2.25} aria-hidden />
        </button>
        <button
          type="button"
          className={`${toolbarBtn} ${alignActive('center') ? toolbarBtnActive : ''}`}
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          title="Align center"
        >
          <AlignCenter className="h-4 w-4" strokeWidth={2.25} aria-hidden />
        </button>
        <button
          type="button"
          className={`${toolbarBtn} ${alignActive('right') ? toolbarBtnActive : ''}`}
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          title="Align right"
        >
          <AlignRight className="h-4 w-4" strokeWidth={2.25} aria-hidden />
        </button>
        <button
          type="button"
          className={`${toolbarBtn} ${alignActive('justify') ? toolbarBtnActive : ''}`}
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          title="Justify"
        >
          <AlignJustify className="h-4 w-4" strokeWidth={2.25} aria-hidden />
        </button>

        <span className="mx-0.5 hidden h-6 w-px bg-slate-200 sm:inline dark:bg-slate-600" aria-hidden />

        <button type="button" className={toolbarBtn} onClick={setLink} title="Insert link">
          <Link2 className="h-4 w-4" strokeWidth={2.25} aria-hidden />
        </button>
        <button
          type="button"
          className={toolbarBtn}
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Horizontal line"
        >
          <Minus className="h-4 w-4" strokeWidth={2.25} aria-hidden />
        </button>

        <span className="mx-0.5 hidden h-6 w-px bg-slate-200 sm:inline dark:bg-slate-600" aria-hidden />

        <button
          type="button"
          className={toolbarBtn}
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo"
        >
          <Undo2 className="h-4 w-4" strokeWidth={2.25} aria-hidden />
        </button>
        <button
          type="button"
          className={toolbarBtn}
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo"
        >
          <Redo2 className="h-4 w-4" strokeWidth={2.25} aria-hidden />
        </button>

        <span className="mx-0.5 hidden h-6 w-px bg-slate-200 sm:inline dark:bg-slate-600" aria-hidden />

        <div className="flex items-center gap-1">
          <Type className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
          <select
            className={`${toolbarSelect} min-w-[9rem]`}
            value={fontSize}
            onChange={(e) => {
              const v = e.target.value;
              if (!v) editor.chain().focus().unsetMark('blogFontSize').run();
              else editor.chain().focus().setMark('blogFontSize', { size: v }).run();
            }}
            aria-label="Font size"
            title="Font size"
          >
            <option value="">Default size</option>
            <option value="0.875rem">Small</option>
            <option value="1.125rem">Large</option>
            <option value="1.25rem">Larger</option>
            <option value="1.5rem">Extra large</option>
            <option value="2rem">Title</option>
          </select>
        </div>
      </div>
      <div className={`blog-rich-editor-scroll min-h-0 flex-1 overflow-y-auto ${minHeightClass}`}>
        <EditorContent editor={editor} className="tiptap-editor-surface px-3 py-3 sm:px-4 sm:py-4" />
      </div>
    </div>
  );
}

type InnerProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeightClass: string;
};

function BlogRichTiptapInner({ value, onChange, placeholder, minHeightClass }: InnerProps) {
  const lastEmittedHtml = useRef<string | undefined>(undefined);
  const editorRef = useRef<Editor | null>(null);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const extensions = useMemo(
    () => [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: {
          openOnClick: false,
          autolink: true,
          defaultProtocol: 'https',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph', 'listItem'],
      }),
      Placeholder.configure({
        placeholder: placeholder ?? 'Start writing…',
      }),
      BlogFontSize,
    ],
    [placeholder],
  );

  const editor = useEditor(
    {
      immediatelyRender: false,
      shouldRerenderOnTransaction: true,
      extensions,
      content: value?.trim() ? value : '<p></p>',
      onCreate: ({ editor: ed }) => {
        editorRef.current = ed;
      },
      onDestroy: () => {
        editorRef.current = null;
      },
      editorProps: {
        attributes: {
          class: 'tiptap ProseMirror focus:outline-none',
        },
        transformPastedHTML(html) {
          let h = html;
          const body = h.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
          if (body) h = body[1];
          h = h.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
          return h;
        },
        handlePaste(_view, event) {
          const e = event as ClipboardEvent;
          const html = e.clipboardData?.getData('text/html') ?? '';
          const text = e.clipboardData?.getData('text/plain') ?? '';

          if (html && /<[uo]l\b/i.test(html)) {
            return false;
          }

          const listHtml = plainTextPasteToListHtml(text);
          if (listHtml && editorRef.current) {
            e.preventDefault();
            editorRef.current.chain().focus().insertContent(listHtml).run();
            return true;
          }
          return false;
        },
      },
      onUpdate: ({ editor: ed }) => {
        const html = ed.getHTML();
        lastEmittedHtml.current = html;
        onChangeRef.current(html);
      },
    },
    [extensions],
  );

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    if (
      lastEmittedHtml.current !== undefined &&
      isHtmlEffectivelyEqual(value, lastEmittedHtml.current)
    ) {
      return;
    }
    const cur = editor.getHTML();
    if (isHtmlEffectivelyEqual(cur, value)) {
      lastEmittedHtml.current = cur;
      return;
    }
    editor.commands.setContent(value?.trim() ? value : '<p></p>', { emitUpdate: false });
    lastEmittedHtml.current = editor.getHTML();
  }, [value, editor]);

  if (!editor) {
    return (
      <div
        className={`!p-0 ${dashboardNestedCardClass} bg-slate-50/90 dark:bg-slate-900/80 ${minHeightClass}`}
        aria-busy
      />
    );
  }

  return <BlogEditorToolbar editor={editor} minHeightClass={minHeightClass} />;
}

type Props = {
  instanceKey: string;
  label: string;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  minHeightClass?: string;
  embedded?: boolean;
  showHint?: boolean;
  'aria-label'?: string;
};

/**
 * Word-style rich text for article HTML. Stored as HTML; public pages render with `prepareBlogBodyHtml`.
 */
export function BlogRichContentField({
  instanceKey,
  label,
  value,
  onChange,
  placeholder,
  minHeightClass = 'min-h-[26rem] sm:min-h-[30rem]',
  embedded = false,
  showHint = true,
  'aria-label': ariaLabel,
}: Props) {
  const fieldId = useId();

  return (
    <div className={embedded ? '' : 'sm:col-span-2'}>
      {label ? (
        <label htmlFor={fieldId} className={labelClass}>
          {label}
        </label>
      ) : null}
      <div id={label ? fieldId : undefined} aria-label={!label && ariaLabel ? ariaLabel : undefined}>
        <BlogRichTiptapInner
          key={instanceKey}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          minHeightClass={minHeightClass}
        />
      </div>
      {showHint ? (
        <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
          Formatting matches what readers see (bold, headings, lists, alignment, links). Content is saved as HTML.
        </p>
      ) : null}
    </div>
  );
}
