/** @jsx h */
import {
  Button,
  LoadingIndicator,
  MiddleAlign,
  render,
  Text,
} from "@create-figma-plugin/ui";
import { h } from "preact";
import { useCallback, useRef, useEffect, useState } from "preact/hooks";

import styles from "./ChatStyles.module.css";
import { MessageBubble } from "./components/MessageBubble";
import { ConnectionStatusIndicator } from "./components/ConnectionStatus";
import { FigmaAPITester } from "./components/FigmaAPITester";
import { useChatConnection } from "./hooks";
import { CONNECTION_STATUS, DEFAULT_MESSAGES, KEYS } from "./constants";

function Plugin() {
  const [showAPITester, setShowAPITester] = useState(false);
  
  const {
    messages,
    isLoading,
    connectionStatus,
    inputValue,
    currentError,
    sendMessage,
    handleInputChange,
    retryConnection,
    clearError,
    retryErrorRecovery,
  } = useChatConnection();

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleInput = useCallback(
    (event: Event) => {
      const target = event.target as HTMLTextAreaElement;
      handleInputChange(target.value);
    },
    [handleInputChange]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === KEYS.ENTER && !event.shiftKey) {
        event.preventDefault();
        if (
          inputValue.trim() !== "" &&
          !isLoading &&
          connectionStatus === CONNECTION_STATUS.CONNECTED
        ) {
          sendMessage();
        }
      }
    },
    [sendMessage, inputValue, isLoading, connectionStatus]
  );

  const showInputArea = connectionStatus !== CONNECTION_STATUS.ERROR;
  const isSendDisabled =
    inputValue.trim() === "" ||
    isLoading ||
    connectionStatus !== CONNECTION_STATUS.CONNECTED;

  // 如果显示 API 测试器，则直接返回测试界面
  if (showAPITester) {
    return (
      <div className={styles.pluginWrapper}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 16px", borderBottom: "1px solid #eee" }}>
          <Text style={{ fontWeight: "bold" }}>🧪 Figma API 测试模式</Text>
          <Button onClick={() => setShowAPITester(false)} secondary>返回聊天</Button>
        </div>
        <FigmaAPITester />
      </div>
    );
  }

  return (
    <div className={styles.pluginWrapper}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 16px", borderBottom: "1px solid #eee" }}>
        <ConnectionStatusIndicator status={connectionStatus} />
        <Button onClick={() => setShowAPITester(true)} secondary>API 测试</Button>
      </div>

      <div className={styles.chatHistory}>
        {/* Initial Prompt */}
        {messages.length === 0 &&
          !isLoading &&
          connectionStatus !== CONNECTION_STATUS.ERROR && (
            <MiddleAlign>
              <Text className={styles.initialPrompt}>
                {DEFAULT_MESSAGES.INITIAL_PROMPT}
              </Text>
            </MiddleAlign>
          )}
        {/* Messages */}
        {messages.map((message, index) => (
          <MessageBubble
            key={message.id || `msg-${index}`}
            message={message.text}
            isUser={message.isUser}
            isComplete={message.isComplete !== false}
            id={message.id}
          />
        ))}
        {/* Loading Indicator */}
        {isLoading && (
          <div className={styles.loadingContainer}>
            <LoadingIndicator />
          </div>
        )}
        {/* Connection Error Display */}
        {connectionStatus === "error" && (
          <div className={styles.connectionError}>
            <Text className={styles.errorText}>
              Connection failed. Please ensure the backend service is running
              and try again.
            </Text>
            {/* FIX: Removed the redundant disabled check here */}
            <Button onClick={retryConnection}>Retry Connection</Button>
          </div>
        )}
        <div ref={messagesEndRef} /> {/* Scroll target */}
      </div>

      {/* Input Area */}
      {showInputArea && (
        <div className={styles.inputContainer}>
          <textarea
            className={styles.textarea}
            placeholder={
              connectionStatus === CONNECTION_STATUS.CONNECTED
                ? DEFAULT_MESSAGES.PLACEHOLDER_CONNECTED
                : DEFAULT_MESSAGES.PLACEHOLDER_CONNECTING
            }
            value={inputValue}
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            disabled={connectionStatus !== CONNECTION_STATUS.CONNECTED}
            rows={4}
          />
          <button
            className={styles.sendButtonOverlay}
            onClick={sendMessage}
            disabled={isSendDisabled}
          >
            Send
          </button>
        </div>
      )}
    </div>
  );
}

export default render(Plugin);
