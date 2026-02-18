import { LOCAL_NAME_PREFIX, DEVICE_ID_LENGTH } from "./constants";
import * as Central from "./central";
import * as Peripheral from "./peripheral";
import type { Subscription } from "react-native-ble-plx";
import type { EventSubscription } from "expo-modules-core";

export type DiscoveryState =
  | "idle"
  | "discovering"
  | "negotiating"
  | "connected"
  | "disconnected";

export type Role = "central" | "peripheral" | null;

export interface DiscoveryCallbacks {
  onStateChange: (state: DiscoveryState) => void;
  onRoleAssigned: (role: Role) => void;
  onPeerName: (name: string) => void;
  onMessageReceived: (data: number[]) => void;
  onError: (error: string) => void;
}

function generateDeviceId(): string {
  const bytes = new Uint8Array(DEVICE_ID_LENGTH);
  for (let i = 0; i < DEVICE_ID_LENGTH; i++) {
    bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function parseDeviceId(localName: string): string | null {
  if (!localName.startsWith(LOCAL_NAME_PREFIX)) return null;
  return localName.slice(LOCAL_NAME_PREFIX.length);
}

function deviceIdToNumber(hex: string): number {
  return parseInt(hex, 16) >>> 0;
}

export class DiscoveryEngine {
  private state: DiscoveryState = "idle";
  private role: Role = null;
  private localDeviceId: string;
  private localName: string;
  private callbacks: DiscoveryCallbacks;
  private subscriptions: (Subscription | EventSubscription)[] = [];
  private connectedDeviceId: string | null = null;
  private isDestroyed = false;

  constructor(callbacks: DiscoveryCallbacks) {
    this.callbacks = callbacks;
    this.localDeviceId = generateDeviceId();
    this.localName = LOCAL_NAME_PREFIX + this.localDeviceId;
  }

  getLocalName(): string {
    return this.localName;
  }

  getState(): DiscoveryState {
    return this.state;
  }

  getRole(): Role {
    return this.role;
  }

  private setState(newState: DiscoveryState) {
    this.state = newState;
    this.callbacks.onStateChange(newState);
  }

  private setRole(newRole: Role) {
    this.role = newRole;
    this.callbacks.onRoleAssigned(newRole);
  }

  async start(): Promise<void> {
    if (this.isDestroyed) return;
    this.cleanup();
    this.setState("discovering");

    // Start advertising as peripheral
    try {
      await Peripheral.startAdvertising(this.localName);
    } catch (e: any) {
      this.callbacks.onError(`Advertising failed: ${e.message}`);
    }

    // Start scanning as central
    Central.startScanning((device) => {
      if (this.state !== "discovering" || this.isDestroyed) return;

      const name = device.localName;
      if (!name) return;

      const peerId = parseDeviceId(name);
      if (!peerId) return;

      this.handlePeerDiscovered(device.id, peerId, name);
    });
  }

  private async handlePeerDiscovered(
    bleDeviceId: string,
    peerHexId: string,
    peerName: string
  ) {
    if (this.state !== "discovering") return;
    this.setState("negotiating");

    const myNum = deviceIdToNumber(this.localDeviceId);
    const peerNum = deviceIdToNumber(peerHexId);

    if (myNum === peerNum) {
      // Extremely unlikely collision — regenerate and restart
      this.localDeviceId = generateDeviceId();
      this.localName = LOCAL_NAME_PREFIX + this.localDeviceId;
      this.setState("discovering");
      return;
    }

    if (myNum < peerNum) {
      // I'm central — connect to peer
      this.setRole("central");
      this.callbacks.onPeerName(peerName);
      await this.connectAsCentral(bleDeviceId);
    } else {
      // I'm peripheral — wait for peer to connect to me
      this.setRole("peripheral");
      this.callbacks.onPeerName(peerName);
      Central.stopScanning();
      this.waitForCentralConnection();
    }
  }

  private async connectAsCentral(bleDeviceId: string) {
    try {
      Central.stopScanning();
      await Peripheral.stopAdvertising();

      const device = await Central.connectToPeripheral(bleDeviceId);
      this.connectedDeviceId = device.id;

      // Subscribe to messages from peripheral
      const msgSub = Central.subscribeToMessages(device.id, (data) => {
        this.callbacks.onMessageReceived(data);
      });
      this.subscriptions.push(msgSub);

      // Monitor disconnect
      const dcSub = Central.onDeviceDisconnected(device.id, () => {
        this.handleDisconnect();
      });
      this.subscriptions.push(dcSub);

      this.setState("connected");
    } catch (e: any) {
      this.callbacks.onError(`Connection failed: ${e.message}`);
      this.restart();
    }
  }

  private waitForCentralConnection() {
    const sub = Peripheral.onCentralConnected(() => {
      this.setState("connected");
    });
    this.subscriptions.push(sub);

    const msgSub = Peripheral.onMessageReceived((data) => {
      this.callbacks.onMessageReceived(data);
    });
    this.subscriptions.push(msgSub);

    const dcSub = Peripheral.onCentralDisconnected(() => {
      this.handleDisconnect();
    });
    this.subscriptions.push(dcSub);
  }

  async sendData(data: number[]): Promise<void> {
    if (this.state !== "connected") return;

    if (this.role === "central" && this.connectedDeviceId) {
      await Central.sendMessage(this.connectedDeviceId, data);
    } else if (this.role === "peripheral") {
      await Peripheral.sendNotification(data);
    }
  }

  private handleDisconnect() {
    if (this.isDestroyed) return;
    this.setState("disconnected");
    this.connectedDeviceId = null;
    this.setRole(null);
    // Auto-restart discovery after a short delay
    setTimeout(() => {
      if (!this.isDestroyed) {
        this.restart();
      }
    }, 1000);
  }

  private async restart() {
    this.cleanup();
    await this.start();
  }

  private cleanup() {
    for (const sub of this.subscriptions) {
      sub.remove();
    }
    this.subscriptions = [];
    Central.stopScanning();
  }

  async destroy(): Promise<void> {
    this.isDestroyed = true;
    this.cleanup();
    if (this.connectedDeviceId) {
      await Central.disconnect(this.connectedDeviceId);
    }
    await Peripheral.stopAdvertising();
    this.setState("idle");
  }
}
