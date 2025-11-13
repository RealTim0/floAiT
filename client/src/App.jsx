// src/App.jsx
import React, { useState, useEffect, useRef } from "react";
import api from "./api";
import FloatingButton from "./FloatingButton";
import Sidebar from "./SideBar";
import "./App.css";
import { Send } from "lucide-react";

const MAX_LENGTH = 150;

const App = () => {
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem("messages");
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    return parsed.map((msg) => ({ ...msg, time: new Date(msg.time) }));
  });

  const [conversations, setConversations] = useState(() => {
    const saved = localStorage.getItem("conversations");
    if (!saved) return [];
    return JSON.parse(saved);
  });

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [widgetVisible, setWidgetVisible] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    return saved ? JSON.parse(saved) : false;
  });
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState(() => {
    return localStorage.getItem("currentConversationId") || null;
  });
  const [toast, setToast] = useState(null);
  const [undoSnapshot, setUndoSnapshot] = useState(null);
  const messagesEndRef = useRef(null);
  const undoTimeoutRef = useRef(null);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, widgetVisible]);

  // Persist messages
  useEffect(() => {
    localStorage.setItem("messages", JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem("conversations", JSON.stringify(conversations));
  }, [conversations]);

  useEffect(() => {
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
  }, [darkMode]);

  useEffect(() => {
    if (currentConversationId) {
      localStorage.setItem("currentConversationId", currentConversationId);
    } else {
      localStorage.removeItem("currentConversationId");
    }
  }, [currentConversationId]);

  // One-time migration: if old messages exist but no conversations, create one
  useEffect(() => {
    if (messages.length > 0 && (!conversations || conversations.length === 0)) {
      const newConvId =
        (typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `conv-${Date.now()}`);
      const newConversation = {
        id: newConvId,
        title: "New Chat",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: messages,
      };
      setConversations([newConversation]);
      setCurrentConversationId(newConvId);
    } else if (
      messages.length === 0 &&
      conversations.length > 0 &&
      !currentConversationId
    ) {
      // If we have conversations but no selected one, pick the most recent
      const sorted = [...conversations].sort(
        (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
      );
      const pick = sorted[0];
      setCurrentConversationId(pick.id);
      setMessages(pick.messages || []);
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ensureActiveConversation = () => {
    if (currentConversationId) return currentConversationId;
    const newConvId =
      (typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `conv-${Date.now()}`);
    const newConversation = {
      id: newConvId,
      title: "New Chat",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    };
    setConversations((prev) => [newConversation, ...prev]);
    setCurrentConversationId(newConvId);
    return newConvId;
  };

  const setConversationTitleIfEmpty = (convId, suggestedTitle) => {
    if (!suggestedTitle) return;
    setConversations((prev) =>
      prev.map((c) =>
        c.id === convId && (!c.title || c.title === "New Chat")
          ? { ...c, title: suggestedTitle }
          : c
      )
    );
  };

  // Close sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        sidebarVisible &&
        !e.target.closest(".sidebar") &&
        !e.target.closest(".sidebar-toggle")
      ) {
        setSidebarVisible(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [sidebarVisible]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = {
      id: Date.now(),
      text: input,
      sender: "user",
      time: new Date(),
      expanded: false,
    };
    setMessages((prev) => [...prev, userMessage]);
    // Update active conversation with user message
    const convId = ensureActiveConversation();
    setConversations((prev) =>
      prev.map((c) =>
        c.id === convId
          ? {
              ...c,
              messages: [...(c.messages || []), userMessage],
              updatedAt: new Date().toISOString(),
            }
          : c
      )
    );
    setInput("");
    setLoading(true);

    try {
      const res = await api.post(`/api/chat`, {
        message: userMessage.text,
      });

      const aiText = res.data?.reply || "No response received.";
      const aiMessage = {
        id:
          (typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-ai`),
        text: aiText,
        sender: "floAiT",
        time: new Date(),
        expanded: false,
      };
      setMessages((prev) => [...prev, aiMessage]);
      // Append AI message to active conversation
      setConversations((prev) =>
        prev.map((c) =>
          c.id === convId
            ? {
                ...c,
                messages: [...(c.messages || []), aiMessage],
                updatedAt: new Date().toISOString(),
              }
            : c
        )
      );
      // If conversation title is empty, use first user message as title
      setConversationTitleIfEmpty(convId, userMessage.text.slice(0, 40));
    } catch (err) {
      console.error("Server error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 2,
          text: "Error: Could not get AI response",
          sender: "floAiT",
          time: new Date(),
          expanded: false,
        },
      ]);
      // Also record error into conversation for consistency
      setConversations((prev) =>
        prev.map((c) =>
          c.id === convId
            ? {
                ...c,
                messages: [
                  ...(c.messages || []),
                  {
                    id: Date.now() + 2,
                    text: "Error: Could not get AI response",
                    sender: "floAiT",
                    time: new Date(),
                    expanded: false,
                  },
                ],
                updatedAt: new Date().toISOString(),
              }
            : c
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleWidget = () => setWidgetVisible((prev) => !prev);
  const toggleTheme = () => setDarkMode((prev) => !prev);
  const toggleSidebar = () => setSidebarVisible((prev) => !prev);
  const toggleExpand = (id) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === id ? { ...msg, expanded: !msg.expanded } : msg
      )
    );
  };

  const deleteAllConversations = () => {
    const confirmed = window.confirm(
      "Delete all conversations? This action cannot be undone."
    );
    if (!confirmed) return;

    const snapshot = {
      conversations,
      currentConversationId,
      messages,
    };

    setUndoSnapshot(snapshot);
    setToast({
      message: "All chats deleted",
      actionLabel: "Undo",
    });
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
    }
    undoTimeoutRef.current = setTimeout(() => {
      setUndoSnapshot(null);
      setToast(null);
    }, 5000);

    localStorage.removeItem("messages");
    localStorage.removeItem("conversations");
    localStorage.removeItem("currentConversationId");
    setMessages([]);
    setConversations([]);
    setCurrentConversationId(null);
    setSidebarVisible(false);
  };

  const handleUndoDelete = () => {
    if (!undoSnapshot) return;
    const { conversations: prevConversations, currentConversationId: prevId, messages: prevMessages } =
      undoSnapshot;
    setConversations(prevConversations);
    setCurrentConversationId(prevId);
    setMessages(prevMessages);
    setUndoSnapshot(null);
    setToast(null);
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
      undoTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current);
      }
    };
  }, []);

  const addNewConversation = () => {
    const newConvId =
      (typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `conv-${Date.now()}`);
    const newConversation = {
      id: newConvId,
      title: "New Chat",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    };
    setConversations((prev) => [newConversation, ...prev]);
    setCurrentConversationId(newConvId);
    setMessages([]);
    setSidebarVisible(false);
  };

  const openConversation = (conversationId) => {
    const conv = conversations.find((c) => c.id === conversationId);
    if (!conv) return;
    setCurrentConversationId(conversationId);
    setMessages(conv.messages || []);
    setSidebarVisible(false);
  };

  // Group messages by date with friendly labels
  const toDateKey = (d) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const todayKey = toDateKey(new Date());
  const yesterdayKey = toDateKey(new Date(Date.now() - 24 * 60 * 60 * 1000));
  const groupedMessages = messages.reduce((groups, msg) => {
    const msgDate = msg.time instanceof Date ? msg.time : new Date(msg.time);
    const key = toDateKey(msgDate);
    let label;
    if (key === todayKey) label = "Today";
    else if (key === yesterdayKey) label = "Yesterday";
    else label = msgDate.toLocaleDateString();
    if (!groups[label]) groups[label] = [];
    groups[label].push(msg);
    return groups;
  }, {});

  return (
    <>
      {!widgetVisible && <FloatingButton onClick={toggleWidget} />}
      {widgetVisible && (
        <div className={`chat-widget ${darkMode ? "dark" : "light"}`}>
          <div className="chat-header">
            <h3>floAiT</h3>
            <div className="header-buttons">
              <button className="sidebar-toggle" onClick={toggleSidebar}>
                {sidebarVisible ? "✕" : "☰"}
              </button>
              <button className="minimize" onClick={toggleWidget}>
                ⬇
              </button>
            </div>
          </div>

          {/* Sidebar overlay */}
          <Sidebar
            visible={sidebarVisible}
            toggleSidebar={toggleSidebar}
            toggleTheme={toggleTheme}
            darkMode={darkMode}
            addNewConversation={addNewConversation}
            openConversation={openConversation}
            conversations={conversations}
            currentConversationId={currentConversationId}
            renameConversation={(id, title) =>
              setConversations((prev) =>
                prev.map((c) =>
                  c.id === id ? { ...c, title: title || "New Chat" } : c
                )
              )
            }
            deleteAllConversations={deleteAllConversations}
          />

          <div className="chat-body">
            {Object.keys(groupedMessages)
              .sort((a, b) => new Date(a) - new Date(b))
              .map((date) => (
                <div key={date}>
                  <div className="date-separator">{date}</div>
                  {groupedMessages[date].map((msg) => (
                    <div
                      key={msg.id}
                      className={`chat-message ${
                        msg.sender === "user" ? "user" : "floAiT"
                      } ${msg.expanded ? "expanded" : ""}`}
                    >
                      <span>
                        {msg.text.length > MAX_LENGTH && !msg.expanded
                          ? msg.text.slice(0, MAX_LENGTH) + "..."
                          : msg.text}
                      </span>
                      {msg.text.length > MAX_LENGTH && (
                        <div
                          className="read-more"
                          onClick={() => toggleExpand(msg.id)}
                        >
                          {msg.expanded ? "Read less" : "Read more"}
                        </div>
                      )}
                      <div className="timestamp">
                        {msg.time instanceof Date
                          ? msg.time.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : new Date(msg.time).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            {loading && <div className="typing-indicator">floAiT is typing...</div>}
            <div ref={messagesEndRef} />
          </div>

          {toast && (
            <div className="chat-toast">
              <span>{toast.message}</span>
              {toast.actionLabel && (
                <button onClick={handleUndoDelete}>{toast.actionLabel}</button>
              )}
            </div>
          )}

          <div className="chat-input">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="What's up?"
              disabled={loading}
              rows={1}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <button onClick={handleSend} disabled={loading || !input.trim()}>
              <Send size={18} />
              <span>Send</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default App;
