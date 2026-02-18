import { useState, useCallback, useRef } from "react";
import { useDiscovery } from "./useDiscovery";
import {
  encodeMessage,
  feedFragment,
  createReassemblyBuffer,
  type ReassemblyBuffer,
} from "../ble/messaging";

export interface UseChatResult {
  sent: string | null;
  received: string | null;
  state: ReturnType<typeof useDiscovery>["state"];
  role: ReturnType<typeof useDiscovery>["role"];
  peerName: string | null;
  localName: string;
  error: string | null;
  sendMessage: (text: string) => Promise<void>;
  start: () => Promise<void>;
  destroy: () => Promise<void>;
}

export function useChat(): UseChatResult {
  const [sent, setSent] = useState<string | null>(null);
  const [received, setReceived] = useState<string | null>(null);
  const reassemblyRef = useRef<ReassemblyBuffer>(createReassemblyBuffer());

  const handleMessageReceived = useCallback((data: number[]) => {
    const text = feedFragment(reassemblyRef.current, data);
    if (text) {
      setReceived(text);
    }
  }, []);

  const discovery = useDiscovery(handleMessageReceived);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || !discovery.engine) return;

      const trimmed = text.trim();
      setSent(trimmed);

      const fragments = encodeMessage(trimmed);
      for (const fragment of fragments) {
        await discovery.engine.sendData(fragment);
      }
    },
    [discovery.engine]
  );

  return {
    sent,
    received,
    state: discovery.state,
    role: discovery.role,
    peerName: discovery.peerName,
    localName: discovery.localName,
    error: discovery.error,
    sendMessage,
    start: discovery.start,
    destroy: discovery.destroy,
  };
}
