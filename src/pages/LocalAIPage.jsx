import React, { useState, useEffect, useRef, useContext } from "react";
import { localAIApi } from "../services/localAIApi";
import { LocalAIContext } from "../context/LocalAIContext";

const LocalAIPage = () => {
  const { messages, setMessages, input, setInput } = useContext(LocalAIContext);
  const [isLoading, setIsLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState("checking");
  const messagesEndRef = useRef(null);

  const supportedCommands = [
    "Check stock for item ITEM-01",
    "Show low stock alerts",
    "Find item with laptop or keyword",
    "Create new item ITEM-02",
    "Receive 100 units of ITEM-01 in HYD-EAST lot LOT-01",
  ];

  const quickActions = [
    { text: "Check stock", command: supportedCommands[0] },
    { text: "Low stock alerts", command: supportedCommands[1] },
    { text: "Find item", command: supportedCommands[1] },
    { text: "Create item", command: supportedCommands[3] },
    { text: "Receive stock", command: supportedCommands[4] },
  ];

  // --- persist state so navigation doesn't wipe the chat ---
  useEffect(() => {
    // only add the greeting on first mount if there's no existing conversation
    if (messages.length === 0) {
      setMessages([
        {
          type: "ai",
          content:
            "👋 Hello Ajay!\n\nI am your ERP AI Copilot. Purpose: I only answer questions and perform actions related to ERP products — inventory, items, warehouses, stock movements, transfers and reports. I will refuse unrelated requests.\n\nYou can manage inventory using natural language. Try:\n• Check stock for ITEM-01\n• Receive 100 units of ITEM-01 into a warehouse\n• Show low stock alerts\n• Create item ITEM-02\n\nExamples you can say: 'Check stock for ITEM-01', 'Receive 100 units', 'Show low stock alerts'",
          timestamp: new Date(),
        },
      ]);
    }

    checkAIStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const checkAIStatus = async () => {
    try {
      const status = await localAIApi.healthCheck();
      setAiStatus(status.status === "Healthy" ? "online" : "offline");
    } catch {
      setAiStatus("offline");
    }
  };

  const handleSend = async (commandText = input) => {
    if (!commandText.trim()) return;
    const trimmed = commandText.trim().toLowerCase();

    const userMessage = {
      type: "user",
      content: commandText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    // built‑in help/commands shortcut
    if (trimmed === "commands" || trimmed === "help") {
      setIsLoading(false);
      const helpText =
        `Purpose: This assistant only handles ERP product operations — inventory, items, warehouses, stock movements, transfers and reports. I will not process unrelated requests.\n\nI am your built-in AI Assistant! I can understand natural language to help you manage your ERP faster. Here are a few things you can say to me:\n\n**📦 Stock Operations:**\n• 'Check stock for PROD-01'\n• 'Receive 100 boxes of PROD-01 into MAIN'\n• 'Issue 5 units of PROD-01 due to damage'\n• 'Set stock of PROD-01 to 45 in MAIN'\n• 'Show low stock alerts'\n\n**🏷️ Master Data:**\n• 'Create item PROD-02 with description Laptop'\n• 'Create warehouse MAIN-HUB'\n• 'List all items'\n\n**🤖 Advanced Abilities:**\nYou can chain tasks together! Try saying:\n• 'Create item PROD-01 and then receive 100 of them into MAIN'\n\nJust talk to me naturally, and I'll do the rest!`;
      setMessages((prev) => [
        ...prev,
        { type: "ai", content: helpText, timestamp: new Date() },
      ]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await localAIApi.sendCommand(commandText);

      const aiMessage = {
        type: "ai",
        content: response.message || "Command executed successfully.",
        data: response.data,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          type: "ai",
          content:
            "⚠️ Unable to connect to backend. Please ensure .NET API is running.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="erp-app-wrapper vh-100 d-flex flex-column">
      
      {/* HEADER */}
      <div className="erp-topbar d-flex align-items-center px-4 justify-content-between flex-shrink-0">
        <div className="fw-bold fs-5 text-white d-flex align-items-center gap-2">
          <div className="erp-logo-box bg-primary">AI</div>
          <span>NODE.STOCK <small className="fw-normal opacity-75 ms-2 fs-6">Copilot Terminal</small></span>
        </div>
        <div className="d-flex align-items-center gap-2">
          <span className="text-white-50 small">LLM Engine Status:</span>
          <span className={`erp-status-tag ${aiStatus === "online" ? "tag-success" : "tag-warning"}`}>
            {aiStatus === "online" ? "ONLINE & READY" : "OFFLINE"}
          </span>
        </div>
      </div>

      {/* CHAT CONTAINER */}
      <div className="d-flex flex-column flex-grow-1 overflow-hidden bg-light position-relative">
        
        {/* Messages Area */}
        <div className="flex-grow-1 overflow-auto p-4 erp-chat-area">
          <div className="container" style={{ maxWidth: '900px' }}>
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`d-flex mb-4 ${msg.type === "user" ? "justify-content-end" : "justify-content-start"}`}
              >
                {msg.type === "ai" && (
                  <div className="erp-avatar ai-avatar shadow-sm me-3 flex-shrink-0 d-flex align-items-center justify-content-center bg-dark text-white rounded">
                    <span style={{ fontSize: '1.2rem' }}>🤖</span>
                  </div>
                )}

                <div className={`erp-chat-bubble shadow-sm p-3 rounded-3 ${msg.type === "user" ? "user-bubble" : "ai-bubble"}`} style={{ maxWidth: '75%' }}>
                  <div style={{ whiteSpace: "pre-wrap", lineHeight: '1.5' }}>{msg.content}</div>
                  
                  {/* Data Payload Rendering */}
                  {msg.data && (
                    <div className="mt-3 p-3 bg-dark text-success rounded-2 font-monospace small overflow-auto">
                      <pre className="m-0" style={{ fontSize: '0.75rem' }}>
                        {JSON.stringify(msg.data, null, 2)}
                      </pre>
                    </div>
                  )}
                  
                  <div className={`mt-2 small ${msg.type === "user" ? "text-white-50 text-end" : "text-muted"}`} style={{ fontSize: '0.65rem' }}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                {msg.type === "user" && (
                  <div className="erp-avatar user-avatar shadow-sm ms-3 flex-shrink-0 d-flex align-items-center justify-content-center bg-primary text-white rounded">
                    <span style={{ fontSize: '1.2rem' }}>👤</span>
                  </div>
                )}
              </div>
            ))}

            {/* Typing Indicator */}
            {isLoading && (
              <div className="d-flex mb-4 justify-content-start">
                <div className="erp-avatar ai-avatar shadow-sm me-3 flex-shrink-0 d-flex align-items-center justify-content-center bg-dark text-white rounded">
                  <span style={{ fontSize: '1.2rem' }}>🤖</span>
                </div>
                <div className="erp-chat-bubble ai-bubble shadow-sm p-3 rounded-3 text-muted fst-italic">
                  Processing natural language...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Action & Input Area */}
        <div className="bg-white border-top flex-shrink-0 z-1 shadow-sm">
          <div className="container py-3" style={{ maxWidth: '900px' }}>
            
            {/* Quick Actions */}
            <div className="d-flex flex-wrap gap-2 mb-3">
              <span className="text-muted small fw-bold me-2 align-self-center text-uppercase">Quick Actions:</span>
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  className="btn btn-sm btn-light border erp-btn text-muted fw-bold rounded-pill px-3"
                  onClick={() => handleSend(action.command)}
                  disabled={isLoading}
                >
                  {action.text}
                </button>
              ))}
            </div>

            {/* Input Box */}
            <div className="d-flex gap-2">
              <input
                type="text"
                className="form-control erp-input shadow-sm py-2"
                placeholder="Ask the copilot to check inventory, create items, or move stock..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                disabled={isLoading}
                style={{ fontSize: '0.95rem' }}
              />
              <button
                className="btn btn-primary erp-btn px-4 fw-bold shadow-sm"
                onClick={() => handleSend()}
                disabled={isLoading || !input.trim()}
              >
                Send Request
              </button>
            </div>
            
            {/* Context Hint */}
            <div className="mt-2 text-muted" style={{ fontSize: '0.65rem' }}>
              <strong>Available contexts:</strong> {supportedCommands.join(" • ")}
            </div>
          </div>
        </div>

      </div>

      <style>{`
        /* --- ERP THEME CSS --- */
        :root {
          --erp-primary: #0f4c81;
          --erp-bg: #eef2f5;
          --erp-surface: #ffffff;
          --erp-border: #cfd8dc;
          --erp-text-main: #263238;
          --erp-text-muted: #607d8b;
        }

        .erp-app-wrapper {
          background-color: var(--erp-bg);
          color: var(--erp-text-main);
          font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          font-size: 0.85rem;
        }

        .erp-topbar {
          background-color: #1a252f;
          height: 54px;
          border-bottom: 3px solid var(--erp-primary);
          z-index: 10;
        }
        .erp-logo-box {
          color: white;
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 0.9rem;
          letter-spacing: 1px;
        }

        .erp-chat-area::-webkit-scrollbar { width: 8px; }
        .erp-chat-area::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .erp-chat-area::-webkit-scrollbar-track { background: transparent; }

        .erp-avatar {
          width: 40px;
          height: 40px;
        }

        .erp-chat-bubble {
          font-size: 0.9rem;
          position: relative;
        }
        .user-bubble {
          background-color: var(--erp-primary);
          color: white;
          border-bottom-right-radius: 4px !important;
        }
        .ai-bubble {
          background-color: white;
          color: var(--erp-text-main);
          border: 1px solid var(--erp-border);
          border-bottom-left-radius: 4px !important;
        }

        .erp-input {
          border-radius: 4px;
          border-color: #cbd5e1;
        }
        .erp-input:focus {
          border-color: var(--erp-primary);
          box-shadow: 0 0 0 2px rgba(15, 76, 129, 0.2);
        }
        .erp-btn {
          border-radius: 4px;
          letter-spacing: 0.2px;
        }

        /* Status Tags */
        .erp-status-tag {
          font-size: 0.65rem;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 2px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          display: inline-block;
          white-space: nowrap;
        }
        .tag-success { background-color: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
        .tag-warning { background-color: #fef9c3; color: #854d0e; border: 1px solid #fef08a; }
      `}</style>
    </div>
  );
};

export default LocalAIPage;