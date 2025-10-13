import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import "./App.css";
import { Moon, Sun, ChevronDown, Send } from "lucide-react";

export default function App() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const newMessage = { text: input, sender: "user", time: new Date() };
    setMessages((prev) => [...prev, newMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:5000/api/chat", {
        message: input,
      });
      const aiMessage = {
        text: res.data.reply,
        sender: "floAiT",
        time: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      console.error("Chat error:", err);
      const errorMsg = {
        text: "Sorry, something went wrong. 😔",
        sender: "floAiT",
        time: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Floating button */}
      {!isOpen && (
        <button className="floating-btn" onClick={() => setIsOpen(true)}>
          💬
        </button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div className={`chatbox ${isDark ? "dark" : "light"}`}>
          <div className="chat-header">
            <h3>floAiT 💡</h3>
            <div className="chat-controls">
              <button onClick={() => setIsDark(!isDark)} className="icon-btn">
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button onClick={() => setIsOpen(false)} className="icon-btn">
                <ChevronDown size={18} />
              </button>
            </div>
          </div>

          <div className="chat-body">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`chat-message ${
                  msg.sender === "user" ? "user" : "ai"
                }`}
              >
                <div className="bubble">
                  <p>{msg.text}</p>
                  <span className="timestamp">
                    {msg.time.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            ))}
            {loading && (
              <div className="chat-message ai">
                <div className="bubble typing">floAiT is typing...</div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="chat-input">
            <input
              type="text"
              value={input}
              placeholder="Type a message..."
              disabled={loading}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="send-btn"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
