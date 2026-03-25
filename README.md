# Novel Studio

<p align="center">
  <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License">
  <img src="https://img.shields.io/badge/Platform-Windows-blue.svg" alt="Platform">
  <img src="https://img.shields.io/badge/Stack-Tauri%20%2B%20React-purple.svg" alt="Stack">
</p>

---

## 📚 Overview

**Novel Studio** is a professional desktop application for novel writers. It provides a complete writing environment with AI-powered features, world-building tools, and organizational systems to help you write better stories faster.

Whether you're a pantser or a plotter, Novel Studio adapts to your writing style with features like:
- AI Writing Assistant with 12+ modes
- Visual Story Planning Matrix
- World Codex for characters, locations, and lore
- Timeline management
- Character relationship maps
- Local text analysis (no API required)

---

## ✨ Features

### 🤖 AI Writing Assistant
- **12+ Writing Modes**: Continue, Expand, Summarize, Rewrite, Dialogue, Description, Action, Emotion, Analyze, Brainstorm, Outline, World-Build
- **AI Chat**: Ask questions about your story, characters, or plot
- **Smart Prompts**: Context-aware suggestions based on your story
- Works with OpenAI and Anthropic APIs

### 📝 Writing Environment
- **Rich Text Editor**: Full formatting support with TipTap editor
- **Split View**: Write and reference simultaneously
- **Focus Mode**: Distraction-free writing experience
- **Writing Sprints**: Timed sessions with word count goals
- **Typewriter Mode**: Keeps cursor centered while writing

### 📊 Story Planning
- **Matrix View**: Visual chapter and scene organization
- **Drag & Drop**: Reorder chapters and scenes easily
- **Scene Goals/Conflict/Outcome**: Track story beats per scene
- **Status Tracking**: Outline → Draft → Revising → Complete

### 📖 World Codex
- **Characters**: Name, appearance, backstory, motivation, arc, relationships
- **Locations**: Climate, culture, history, population
- **Items**: Origin, powers, history
- **Lore**: World-building notes and rules
- **Events**: Timeline of story events

### 🔗 Character Relationships
- Visual relationship map
- Connection types and strength indicators
- Character-to-character links

### 📅 Timeline
- Chronological story events
- Visual timeline view
- Filter by character or location

### 🏷️ Tag Management
- Custom tags with colors
- Organize scenes, characters, and notes
- Quick filtering across the project

### 📚 Research Notes
- Keep all your research in one place
- Categorize by topic
- Search and filter easily

### 📈 Writing Analysis (Local - No API Required)
- Word count statistics
- Sentence complexity analysis
- Readability scores
- Dialogue vs description ratio
- Passive voice detection
- Sentiment analysis
- Story structure (Three-Act, Hero's Journey)
- Writing feedback and suggestions

### 📜 Revision History
- Automatic version tracking
- Browse past versions
- Restore any previous version

### 🎨 Themes
- **Dark Mode** (default)
- **Light Mode**
- **Sepia Mode** - Easy on the eyes for long writing sessions

### 📤 Export Options
- **TXT**: Plain text for easy sharing
- **JSON**: Full project backup
- **HTML**: Styled document

---

## 🛠️ Tech Stack

- **Tauri** - Desktop framework (Rust + WebView)
- **React** - UI library
- **TypeScript** - Type safety
- **Zustand** - State management
- **TipTap** - Rich text editor

---

## 📥 Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (LTS version)
- [Rust](https://rustup.rs/) (for building)

### Clone the Repository

```bash
git clone https://github.com/Openapps-free/novel-studio.git
cd novel-studio
```

### Install Dependencies

```bash
npm install
```

### Run in Development

```bash
npm run tauri dev
```

### Build for Production

```bash
npm run tauri build
```

The built executable will be at:
```
src-tauri/target/release/Novel-Studio.exe
```

---

## 🎯 Getting Started

1. **Create a Project**: Click "New Project" on the welcome screen
2. **Set Up Your Story**: Add title, synopsis, and target word count
3. **Start Writing**: Go to Write view and begin your story
4. **Use AI Assistance**: Select text and choose an AI mode
5. **Build Your World**: Add characters, locations, and lore in Codex
6. **Plan Your Story**: Use the Matrix view to organize chapters and scenes
7. **Track Progress**: Check Overview for statistics

---

## 🔑 API Configuration

AI features require an API key:

1. Go to **Settings** view
2. Enter your OpenAI or Anthropic API key
3. Choose your preferred provider
4. Save settings

**Note:** Local AI features (text analysis, writing feedback) work without any API key!

---

## 📝 Project Structure

```
novel-studio/
├── src/                    # React frontend
│   ├── components/         # UI components
│   ├── views/              # Page views
│   ├── services/           # AI and storage services
│   ├── store/             # Zustand state management
│   ├── types/             # TypeScript types
│   └── lib/               # Rich text editor
├── src-tauri/             # Rust backend
│   ├── src/               # Rust source code
│   └── icons/             # App icons
├── public/                # Static assets
└── package.json           # Dependencies
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Tauri](https://tauri.app/) - Desktop app framework
- [React](https://react.dev/) - UI library
- [TipTap](https://tiptap.dev/) - Rich text editor
- [Zustand](https://zustand-demo.pmnd.rs/) - State management

---

<p align="center">
  <strong>Happy Writing! ✍️</strong>
</p>
