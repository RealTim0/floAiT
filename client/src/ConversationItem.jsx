// src/ConversationItem.jsx
import React, { useState } from "react";
import "./Sidebar.css";

const ConversationItem = ({ conversation, onClick, onRename, isActive }) => {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(conversation.title || "New Chat");

  const startEdit = (e) => {
    e.stopPropagation();
    setEditing(true);
  };

  const commit = () => {
    const trimmed = value.trim();
    onRename?.(trimmed);
    setEditing(false);
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") {
      commit();
    } else if (e.key === "Escape") {
      setValue(conversation.title || "New Chat");
      setEditing(false);
    }
  };

  const last = conversation.messages?.[conversation.messages.length - 1]?.text || "";
  const snippet = last.slice(0, 50) + (last.length > 50 ? "..." : "");

  return (
    <div className={`conversation-item ${isActive ? "active" : ""}`} onClick={onClick}>
      <div className="conversation-row">
        {editing ? (
          <input
            className="conversation-title-input"
            value={value}
            autoFocus
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKeyDown}
            onBlur={commit}
          />
        ) : (
          <div className="conversation-title">{conversation.title || "New Chat"}</div>
        )}
        {!editing && (
          <button className="rename-btn" onClick={startEdit} aria-label="Rename conversation">
            ✎
          </button>
        )}
      </div>
      <div className="conversation-snippet">{snippet}</div>
    </div>
  );
};

export default ConversationItem;
