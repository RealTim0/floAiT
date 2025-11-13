// src/Sidebar.jsx
import React from "react";
import "./Sidebar.css";
import ConversationItem from "./ConversationItem";
import { Plus, Trash2, Sun, Moon } from "lucide-react";

const Sidebar = ({
  visible,
  toggleSidebar,
  toggleTheme,
  darkMode,
  addNewConversation,
  openConversation,
  conversations = [],
  currentConversationId,
  renameConversation,
  deleteAllConversations,
}) => {
  const sorted = [...conversations].sort(
    (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
  );

  const chatCountLabel =
    sorted.length === 1 ? "1 chat" : `${sorted.length} chats`;

  return (
    <div className={`sidebar ${visible ? "visible" : ""} ${darkMode ? "dark" : ""}`}>
      <div className="sidebar-header">
        <div className="sidebar-title-group">
          <span className="sidebar-title">Conversations</span>
          <span className="sidebar-subtitle">{chatCountLabel}</span>
        </div>
        <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      <div className="sidebar-actions">
        <button className="new-conversation" onClick={addNewConversation}>
          <Plus size={16} />
          <span>New Conversation</span>
        </button>
      </div>

      <div className="sidebar-conversations">
        {sorted.map((c) => (
          <div
            key={c.id}
            className={`conversation-entry ${
              c.id === currentConversationId ? "active" : ""
            }`}
            onClick={() => openConversation(c.id)}
          >
            <ConversationItem
              conversation={c}
              isActive={c.id === currentConversationId}
              onClick={() => openConversation(c.id)}
              onRename={(title) => renameConversation(c.id, title)}
            />
          </div>
        ))}
        {sorted.length === 0 && (
          <div className="sidebar-empty">No conversations yet. Start one!</div>
        )}
      </div>

      <div className="sidebar-footer">
        <button className="delete-btn" onClick={deleteAllConversations}>
          <Trash2 size={16} />
          <span>Delete All Chats</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
