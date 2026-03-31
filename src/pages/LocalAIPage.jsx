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
    // you can add more commands here
  ];

  const quickActions = [
    { text: "Check stock", command: supportedCommands[0] },
    { text: "Low stock alerts", command: supportedCommands[1] },
    { text: "Find item", command: supportedCommands[1] },
    { text: "Create item", command: supportedCommands[2] },
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
        `👤\n🤖\nPurpose: This assistant only handles ERP product operations — inventory, items, warehouses, stock movements, transfers and reports. I will not process unrelated requests.\n\nI am your built-in AI Assistant! I can understand natural language to help you manage your ERP faster. Here are a few things you can say to me:\n\n**📦 Stock Operations:**\n• 'Check stock for PROD-01'\n• 'Receive 100 boxes of PROD-01 into MAIN'\n• 'Issue 5 units of PROD-01 due to damage'\n• 'Set stock of PROD-01 to 45 in MAIN'\n• 'Show low stock alerts'\n\n**🏷️ Master Data:**\n• 'Create item PROD-02 with description Laptop'\n• 'Create warehouse MAIN-HUB'\n• 'List all items'\n\n**🤖 Advanced Abilities:**\nYou can chain tasks together! Try saying:\n• 'Create item PROD-01 and then receive 100 of them into MAIN'\n\nJust talk to me naturally, and I'll do the rest!`;
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
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h2 style={{ margin: 0 }}>ERP AI Copilot</h2>
        <span
          style={{
            ...styles.status,
            backgroundColor: aiStatus === "online" ? "#10a37f" : "#f59e0b",
          }}
        >
          {aiStatus === "online" ? "Online" : "Offline"}
        </span>
      </div>

      {/* Chat Area */}
      <div style={styles.chatArea}>
        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              ...styles.messageRow,
              justifyContent:
                msg.type === "user" ? "flex-end" : "flex-start",
            }}
          >
            {msg.type === "ai" && <div style={styles.aiAvatar}>🤖</div>}

            <div
              style={{
                ...styles.bubble,
                backgroundColor:
                  msg.type === "user" ? "#10a37f" : "#ffffff",
                color: msg.type === "user" ? "white" : "black",
              }}
            >
              <div style={{ whiteSpace: "pre-wrap" }}>{msg.content}</div>
              {msg.data && (
                <pre style={styles.dataBox}>
                  {JSON.stringify(msg.data, null, 2)}
                </pre>
              )}
            </div>

            {msg.type === "user" && <div style={styles.userAvatar}>👤</div>}
          </div>
        ))}

        {isLoading && (
          <div style={styles.messageRow}>
            <div style={styles.aiAvatar}>🤖</div>
            <div style={styles.bubble}>
              <span>Typing...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      <div style={styles.quickActions}>
        {quickActions.map((action, index) => (
          <button
            key={index}
            style={styles.quickBtn}
            onClick={() => handleSend(action.command)}
          >
            {action.text}
          </button>
        ))}
      </div>

      {/* Input Area */}
      <div style={styles.inputArea}>
        <input
          type="text"
          placeholder="Ask something about inventory..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          style={styles.input}
        />
        <button
          onClick={() => handleSend()}
          style={styles.sendBtn}
          disabled={isLoading}
        >
          Send
        </button>
      </div>

      {/* Supported commands hint */}
      <div style={styles.commandsHint}>
        <strong>Available commands:</strong> {supportedCommands.join(" • ")}
      </div>
    </div>
  );
};

const styles = {
  container: {
    height: "90vh",
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#f7f7f8",
    borderRadius: "10px",
  },
  header: {
    padding: "15px 20px",
    backgroundColor: "white",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #e5e7eb",
  },
  commandsHint: {
    padding: "10px 20px",
    fontSize: "0.9rem",
    color: "#555",
    backgroundColor: "#fafafa",
    borderTop: "1px solid #e5e7eb",
    borderBottom: "1px solid #e5e7eb",
  },
  status: {
    color: "white",
    padding: "5px 12px",
    borderRadius: "20px",
    fontSize: "12px",
  },
  chatArea: {
    flex: 1,
    overflowY: "auto",
    padding: "20px",
  },
  messageRow: {
    display: "flex",
    alignItems: "flex-start",
    marginBottom: "15px",
  },
  bubble: {
    maxWidth: "70%",
    padding: "12px",
    borderRadius: "10px",
    boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
  },
  aiAvatar: {
    marginRight: "10px",
    fontSize: "20px",
  },
  userAvatar: {
    marginLeft: "10px",
    fontSize: "20px",
  },
  inputArea: {
    display: "flex",
    padding: "15px",
    backgroundColor: "white",
    borderTop: "1px solid #e5e7eb",
  },
  input: {
    flex: 1,
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    marginRight: "10px",
  },
  sendBtn: {
    padding: "10px 20px",
    backgroundColor: "#10a37f",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
  quickActions: {
    padding: "10px 20px",
    backgroundColor: "#ffffff",
    borderTop: "1px solid #e5e7eb",
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  quickBtn: {
    padding: "6px 12px",
    borderRadius: "20px",
    border: "1px solid #ddd",
    backgroundColor: "#f1f1f1",
    cursor: "pointer",
    fontSize: "12px",
  },
  dataBox: {
    marginTop: "10px",
    backgroundColor: "#f3f4f6",
    padding: "8px",
    borderRadius: "6px",
    fontSize: "12px",
    overflowX: "auto",
  },
};

export default LocalAIPage;