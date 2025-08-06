import { useState, useEffect, useCallback, useRef } from "preact/hooks";

import { ConnectionStatus, PluginError, PluginErrorFactory } from "../types/index";
import { WebSocketService } from "../services/websocket";

// Enhanced message structure for UI display
export interface Message {
  text: string;
  isUser: boolean;
  id?: string;
  isComplete?: boolean;
  isError?: boolean; // Enhanced for error display
  errorType?: string; // Error classification for styling
}

export function useChatConnection() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("disconnected");
  const [inputValue, setInputValue] = useState("");
  const [currentError, setCurrentError] = useState<PluginError | null>(null);

  const currentStreamId = useRef<string | null>(null);
  const wsServiceRef = useRef<WebSocketService | null>(null);

  // --- WebSocket Connection and Callbacks ---
  useEffect(() => {
    console.log("[useChatConnection] Initializing WebSocketService...");

    const wsCallbacks = {
      onStatusChange: (status: ConnectionStatus) => {
        console.log(`[useChatConnection] WS Status Changed: ${status}`);
        setConnectionStatus(status);
        if (status === "error" || status === "disconnected") {
          setIsLoading(false); // Stop loading indicator
          currentStreamId.current = null; // Reset stream tracking
        }
        if (status === "connected") {
          setCurrentError(null); // Clear errors on successful connection
        }
      },
      onError: (error: PluginError) => {
        console.error(`[useChatConnection] Enhanced error received:`, error);
        setCurrentError(error);
        
        // Add error message to chat
        setMessages((prev) => [
          ...prev,
          {
            text: error.userMessage,
            isUser: false,
            id: `error-${error.id}`,
            isComplete: true,
            isError: true,
            errorType: error.type
          }
        ]);
        
        setIsLoading(false);
        currentStreamId.current = null;
      },
      onChunk: (chunk: string) => {
        // Append chunk to the current streaming message or start a new one
        setMessages((prev) => {
          if (currentStreamId.current) {
            // Find and update existing streaming message
            return prev.map((msg) =>
              msg.id === currentStreamId.current
                ? { ...msg, text: msg.text + chunk }
                : msg
            );
          } else {
            // Start new streaming message
            const streamId = `stream-${Date.now()}`;
            currentStreamId.current = streamId;
            console.log(
              "[useChatConnection] Started receiving new stream:",
              streamId
            );
            return [
              ...prev,
              { text: chunk, isUser: false, id: streamId, isComplete: false },
            ];
          }
        });
      },
      onFunctionCall: () => {
        // Function calling is no longer supported
        console.log("[useChatConnection] Function calling is disabled");
      },
      onStreamEnd: (responseId: string) => {
        // Stream finished -> Mark message as complete
        console.log(
          `[useChatConnection] Stream ended. Response ID: ${responseId}`
        );
        if (currentStreamId.current) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === currentStreamId.current
                ? { ...msg, isComplete: true }
                : msg
            )
          );
          currentStreamId.current = null; // Reset stream tracking
        }
        setIsLoading(false); // Stop loading indicator
      },
      onMessage: (message: string) => {
        // Handle general messages/errors from WebSocketService itself
        console.log(`[useChatConnection] Received general message: ${message}`);
        setMessages((prev) => [
          ...prev,
          {
            text: message,
            isUser: false,
            id: `msg-${Date.now()}`,
            isComplete: true,
          },
        ]);
        setIsLoading(false); // Ensure loading stops
        currentStreamId.current = null; // Reset stream tracking
      },
    };

    // Create and connect WebSocketService
    wsServiceRef.current = new WebSocketService(wsCallbacks);
    wsServiceRef.current.connect();

    // --- Listeners for events FROM Main Thread ---
    // Loading functionality is disabled

    // Cleanup on unmount
    return () => {
      console.log(
        "[useChatConnection] Cleaning up WebSocket connection and listeners."
      );
      wsServiceRef.current?.disconnect();
    };
  }, []);

  // --- UI Actions ---

  const sendMessageCallback = useCallback(() => {
    if (
      inputValue.trim() === "" ||
      isLoading ||
      connectionStatus !== "connected"
    ) {
      console.warn("[useChatConnection] Send message prevented:", {
        inputValueEmpty: inputValue.trim() === "",
        isLoading,
        connectionStatus,
      });
      return;
    }

    const userMessageText = inputValue;
    setMessages((prev) => [
      ...prev,
      {
        text: userMessageText,
        isUser: true,
        id: `user-${Date.now()}`,
        isComplete: true,
      },
    ]);
    setInputValue(""); // Clear input

    // Reset stream tracking and set loading for backend response
    currentStreamId.current = null;
    setIsLoading(true);

    if (wsServiceRef.current) {
      console.log("[useChatConnection] Sending user message via WebSocket.");
      wsServiceRef.current.sendMessage(userMessageText);
    } else {
      console.error(
        "[useChatConnection] WebSocket service unavailable, cannot send message."
      );
      
      // Create and handle error using new system
      const serviceError = PluginErrorFactory.connection(
        "WebSocket service unavailable",
        { operation: 'sendMessage', userMessage: userMessageText },
        () => {
          // Recovery handler: try to reconnect
          if (wsServiceRef.current) {
            wsServiceRef.current.connect();
          }
        }
      );
      
      setCurrentError(serviceError);
      setMessages((prev) => [
        ...prev,
        {
          text: serviceError.userMessage,
          isUser: false,
          id: `error-${serviceError.id}`,
          isComplete: true,
          isError: true,
          errorType: serviceError.type
        },
      ]);
      setConnectionStatus("error");
      setIsLoading(false);
    }
  }, [inputValue, isLoading, connectionStatus]);

  const handleInputChangeCallback = useCallback((value: string) => {
    setInputValue(value);
  }, []);

  const retryConnectionCallback = useCallback(() => {
    console.log("[useChatConnection] Retry connection requested.");
    setCurrentError(null); // Clear current error
    if (
      wsServiceRef.current &&
      connectionStatus !== "connected" &&
      connectionStatus !== "connecting"
    ) {
      wsServiceRef.current.connect();
    }
  }, [connectionStatus]);

  // Enhanced error recovery callback
  const clearErrorCallback = useCallback(() => {
    setCurrentError(null);
  }, []);

  // Retry current error's recovery action if available
  const retryErrorRecovery = useCallback(async () => {
    if (currentError?.recoveryHandler) {
      try {
        console.log(`[useChatConnection] Attempting error recovery for: ${currentError.type}`);
        await currentError.recoveryHandler();
        setCurrentError(null);
      } catch (error) {
        console.error(`[useChatConnection] Error recovery failed:`, error);
      }
    }
  }, [currentError]);

  return {
    messages,
    isLoading,
    connectionStatus,
    inputValue,
    currentError, // Enhanced: expose current error
    sendMessage: sendMessageCallback,
    handleInputChange: handleInputChangeCallback,
    retryConnection: retryConnectionCallback,
    clearError: clearErrorCallback, // Enhanced: clear error function
    retryErrorRecovery, // Enhanced: retry error recovery
    currentStreamId: currentStreamId.current,
  };
}
