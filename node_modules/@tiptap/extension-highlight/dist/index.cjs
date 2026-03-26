"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  Highlight: () => Highlight,
  default: () => index_default,
  inputRegex: () => inputRegex,
  pasteRegex: () => pasteRegex
});
module.exports = __toCommonJS(index_exports);

// src/highlight.ts
var import_core = require("@tiptap/core");
var inputRegex = /(?:^|\s)(==(?!\s+==)((?:[^=]+))==(?!\s+==))$/;
var pasteRegex = /(?:^|\s)(==(?!\s+==)((?:[^=]+))==(?!\s+==))/g;
var Highlight = import_core.Mark.create({
  name: "highlight",
  addOptions() {
    return {
      multicolor: false,
      HTMLAttributes: {}
    };
  },
  addAttributes() {
    if (!this.options.multicolor) {
      return {};
    }
    return {
      color: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-color") || element.style.backgroundColor,
        renderHTML: (attributes) => {
          if (!attributes.color) {
            return {};
          }
          return {
            "data-color": attributes.color,
            style: `background-color: ${attributes.color}; color: inherit`
          };
        }
      }
    };
  },
  parseHTML() {
    return [
      {
        tag: "mark"
      }
    ];
  },
  renderHTML({ HTMLAttributes }) {
    return ["mark", (0, import_core.mergeAttributes)(this.options.HTMLAttributes, HTMLAttributes), 0];
  },
  renderMarkdown: (node, h) => {
    return `==${h.renderChildren(node)}==`;
  },
  parseMarkdown: (token, h) => {
    return h.applyMark("highlight", h.parseInline(token.tokens || []));
  },
  markdownTokenizer: {
    name: "highlight",
    level: "inline",
    start: (src) => src.indexOf("=="),
    tokenize(src, _, h) {
      const rule = /^(==)([^=]+)(==)/;
      const match = rule.exec(src);
      if (match) {
        const innerContent = match[2].trim();
        const children = h.inlineTokens(innerContent);
        return {
          type: "highlight",
          raw: match[0],
          text: innerContent,
          tokens: children
        };
      }
    }
  },
  addCommands() {
    return {
      setHighlight: (attributes) => ({ commands }) => {
        return commands.setMark(this.name, attributes);
      },
      toggleHighlight: (attributes) => ({ commands }) => {
        return commands.toggleMark(this.name, attributes);
      },
      unsetHighlight: () => ({ commands }) => {
        return commands.unsetMark(this.name);
      }
    };
  },
  addKeyboardShortcuts() {
    return {
      "Mod-Shift-h": () => this.editor.commands.toggleHighlight()
    };
  },
  addInputRules() {
    return [
      (0, import_core.markInputRule)({
        find: inputRegex,
        type: this.type
      })
    ];
  },
  addPasteRules() {
    return [
      (0, import_core.markPasteRule)({
        find: pasteRegex,
        type: this.type
      })
    ];
  }
});

// src/index.ts
var index_default = Highlight;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Highlight,
  inputRegex,
  pasteRegex
});
//# sourceMappingURL=index.cjs.map