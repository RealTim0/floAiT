import React, { useState, useEffect } from "react";
import "./App.css";

const FloatingButton = ({ onClick }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [rel, setRel] = useState({ x: 0, y: 0 });
  const [dragged, setDragged] = useState(false);

  // Initial bottom-right
  useEffect(() => {
    const updatePosition = () => {
      const btnSize = 50;
      setPosition({
        x: window.innerWidth - btnSize - 20,
        y: window.innerHeight - btnSize - 20,
      });
    };
    updatePosition();
    window.addEventListener("resize", updatePosition);
    return () => window.removeEventListener("resize", updatePosition);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!dragging) return;
      setDragged(true);
      setPosition({ x: e.clientX - rel.x, y: e.clientY - rel.y });
    };
    const handleMouseUp = () => setDragging(false);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging, rel]);

  const handleMouseDown = (e) => {
    setDragging(true);
    setDragged(false);
    setRel({ x: e.clientX - position.x, y: e.clientY - position.y });
    e.stopPropagation();
    e.preventDefault();
  };

  return (
    <div
      className="floating-button"
      onMouseDown={handleMouseDown}
      onClick={() => { if (!dragged) onClick(); }}
      style={{ left: position.x, top: position.y }}
    >
      💬
    </div>
  );
};

export default FloatingButton;
