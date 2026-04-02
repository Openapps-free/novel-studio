import { useState, useRef, useEffect, useCallback } from "react";
import { useStore } from "../store";
import { callAI } from "../services/ai";
import { AIRequest, AIRequestType } from "../types";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

const STORAGE_KEY = "novel-studio-chat-messages";

function loadMessages(): ChatMessage[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveMessages(messages: ChatMessage[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-100)));
  } catch {
    // Storage full or unavailable
  }
}

export function ChatView() {
  const { getProject, settings } = useStore();
  const project = getProject();
  
  const [messages, setMessages] = useState<ChatMessage[]>(loadMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMode, setSelectedMode] = useState<AIRequestType>("brainstorm");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    saveMessages(messages);
  }, [messages]);

  const handleClearChat = () => {
    if (confirm("Clear all chat messages?")) {
      setMessages([]);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const request: AIRequest = {
        type: selectedMode,
        prompt: userMessage.content,
        context: {
          plotSummary: project?.synopsis,
          characterNames: project?.codexEntries
            .filter(e => e.type === "character")
            .map(e => e.title),
        },
      };

      const response = await callAI(request, settings);
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.text,
        timestamp: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: error instanceof Error ? error.message : "Failed to get response from AI",
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickPrompts = [
    "Help me brainstorm character names",
    "Suggest plot twists for my story",
    "How can I improve my dialogue?",
    "Describe a mysterious setting",
    "Create conflict between two characters",
  ];

  if (!project) {
    return (
      <div className="view chat-view">
        <div className="empty-state">
          <h2>No Project</h2>
          <p>Create a project to use the AI Chat</p>
        </div>
      </div>
    );
  }

  const isLocalProvider = settings.apiProvider === "ollama" || settings.apiProvider === "lmstudio";
  const hasConfig = isLocalProvider || (settings.apiKey && settings.apiKey.length > 0);

  if (!hasConfig) {
    return (
      <div className="view chat-view">
        <div className="empty-state">
          <h2>AI Not Configured</h2>
          <p>Please configure your API key or local AI provider in Settings to use the AI Chat</p>
        </div>
      </div>
    );
  }

  return (
    <div className="view chat-view" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div className="chat-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <h2>AI Chat</h2>
          {messages.length > 0 && (
            <button 
              onClick={handleClearChat}
              style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", padding: "6px 12px", borderRadius: "var(--radius-md)", color: "var(--text-secondary)", cursor: "pointer", fontSize: "12px" }}
            >
              Clear Chat
            </button>
          )}
        </div>
        <select
          value={selectedMode}
          onChange={(e) => setSelectedMode(e.target.value as AIRequestType)}
          style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", padding: "8px 12px", borderRadius: "var(--radius-md)", color: "var(--text-primary)" }}
        >
          <option value="brainstorm">Brainstorm</option>
          <option value="continue">Continue Writing</option>
          <option value="expand">Expand</option>
          <option value="summarize">Summarize</option>
          <option value="rewrite">Rewrite</option>
          <option value="dialogue">Dialogue</option>
          <option value="description">Description</option>
          <option value="action">Action</option>
          <option value="emotion">Emotion</option>
          <option value="analyze">Analyze</option>
          <option value="outline">Outline</option>
          <option value="worldbuild">World-Build</option>
        </select>
      </div>

      {messages.length === 0 && (
        <div className="chat-welcome" style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)" }}>
          <h3 style={{ marginBottom: "16px" }}>Start a conversation</h3>
          <p style={{ marginBottom: "24px" }}>Ask anything about your story, characters, plot, or writing advice</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center" }}>
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => setInput(prompt)}
                style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", padding: "8px 16px", borderRadius: "20px", color: "var(--text-primary)", cursor: "pointer" }}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="chat-messages" style={{ flex: 1, overflowY: "auto", marginBottom: "16px", padding: "16px" }}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`chat-message ${msg.role}`}
            style={{
              display: "flex",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                maxWidth: "70%",
                padding: "12px 16px",
                borderRadius: "12px",
                background: msg.role === "user" ? "var(--accent-primary)" : "var(--bg-secondary)",
                color: msg.role === "user" ? "white" : "var(--text-primary)",
                lineHeight: "1.5",
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: "16px" }}>
            <div style={{ padding: "12px 16px", borderRadius: "12px", background: "var(--bg-secondary)", color: "var(--text-secondary)" }}>
              Thinking...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container" style={{ display: "flex", gap: "12px" }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          rows={2}
          style={{
            flex: 1,
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-subtle)",
            padding: "12px",
            borderRadius: "var(--radius-md)",
            color: "var(--text-primary)",
            resize: "none",
            fontFamily: "inherit",
          }}
        />
        <button
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          className="btn btn-primary"
          style={{ alignSelf: "flex-end" }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
