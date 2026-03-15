import React, { createContext, useState, useEffect } from "react";

export const LocalAIContext = createContext({
  messages: [],
  setMessages: () => {},
  input: "",
  setInput: () => {},
});

export const LocalAIProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  // restore from localStorage once
  useEffect(() => {
    const saved = localStorage.getItem("localAIMessages");
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch {
        // if parse fails, just ignore and continue with empty
      }
    }

    const savedIn = localStorage.getItem("localAIInput");
    if (savedIn) {
      setInput(savedIn);
    }
  }, []);

  // persist whenever they change
  useEffect(() => {
    localStorage.setItem("localAIMessages", JSON.stringify(messages));
  }, [messages]);
  useEffect(() => {
    localStorage.setItem("localAIInput", input);
  }, [input]);

  return (
    <LocalAIContext.Provider value={{ messages, setMessages, input, setInput }}>
      {children}
    </LocalAIContext.Provider>
  );
};
