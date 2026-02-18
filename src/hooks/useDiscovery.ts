import { useEffect, useRef, useState, useCallback } from "react";
import {
  DiscoveryEngine,
  type DiscoveryState,
  type Role,
} from "../ble/discovery";

export interface UseDiscoveryResult {
  state: DiscoveryState;
  role: Role;
  peerName: string | null;
  localName: string;
  error: string | null;
  engine: DiscoveryEngine | null;
  start: () => Promise<void>;
  destroy: () => Promise<void>;
}

export function useDiscovery(
  onMessageReceived: (data: number[]) => void
): UseDiscoveryResult {
  const [state, setState] = useState<DiscoveryState>("idle");
  const [role, setRole] = useState<Role>(null);
  const [peerName, setPeerName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const engineRef = useRef<DiscoveryEngine | null>(null);
  const onMessageRef = useRef(onMessageReceived);
  onMessageRef.current = onMessageReceived;

  useEffect(() => {
    return () => {
      engineRef.current?.destroy();
      engineRef.current = null;
    };
  }, []);

  const start = useCallback(async () => {
    if (engineRef.current) {
      await engineRef.current.destroy();
    }

    setError(null);
    setPeerName(null);
    setRole(null);

    const engine = new DiscoveryEngine({
      onStateChange: setState,
      onRoleAssigned: setRole,
      onPeerName: setPeerName,
      onMessageReceived: (data) => onMessageRef.current(data),
      onError: setError,
    });

    engineRef.current = engine;
    await engine.start();
  }, []);

  const destroy = useCallback(async () => {
    if (engineRef.current) {
      await engineRef.current.destroy();
      engineRef.current = null;
    }
  }, []);

  return {
    state,
    role,
    peerName,
    localName: engineRef.current?.getLocalName() ?? "",
    error,
    engine: engineRef.current,
    start,
    destroy,
  };
}
