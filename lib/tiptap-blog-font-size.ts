import { Mark, mergeAttributes } from '@tiptap/core';

/** Inline font size (Word-style “larger text”) — renders as `<span style="font-size:…">`. */
export const BlogFontSize = Mark.create({
  name: 'blogFontSize',
  inclusive: false,

  addOptions() {
    return { HTMLAttributes: {} };
  },

  addAttributes() {
    return {
      size: {
        default: null,
        parseHTML: (element) => {
          if (!(element instanceof HTMLElement)) return null;
          const fs = element.style.fontSize?.trim();
          return fs || null;
        },
        renderHTML: (attributes) => {
          if (!attributes.size) return {};
          return { style: `font-size: ${attributes.size}` };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span',
        getAttrs: (el) => {
          if (!(el instanceof HTMLElement)) return false;
          const fs = el.style.fontSize?.trim();
          if (!fs) return false;
          return { size: fs };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },
});
