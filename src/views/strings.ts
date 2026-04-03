export const STRINGS = {
  en: {
    common: {
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
      edit: "Edit",
      loading: "Loading...",
    },
    editor: {
      ai_assistant: "AI Assistant",
      history: "History",
      focus_mode: "Focus Mode",
      typewriter: "Typewriter",
      placeholder: "Start writing your masterpiece...",
    },
    settings: {
      appearance: "Appearance",
      high_contrast: "High Contrast Mode",
      theme: "Theme",
      font_size: "Font Size",
    }
  }
};

export type Locale = keyof typeof STRINGS;