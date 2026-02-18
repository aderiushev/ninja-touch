import { requireNativeModule } from "expo-modules-core";
import type { EventSubscription } from "expo-modules-core";

export interface CentralConnectedEvent {
  centralId: string;
}

export interface CentralDisconnectedEvent {
  centralId: string;
}

export interface MessageReceivedEvent {
  data: number[];
}

interface BlePeripheralNative {
  startAdvertising(localName: string, serviceUuid: string): Promise<void>;
  stopAdvertising(): Promise<void>;
  sendNotification(
    characteristicUuid: string,
    data: number[]
  ): Promise<boolean>;
  isAdvertising(): Promise<boolean>;
  addListener<T>(eventName: string, listener: (event: T) => void): EventSubscription;
}

const NativeBlePeripheral =
  requireNativeModule<BlePeripheralNative>("BlePeripheral");

export function startAdvertising(
  localName: string,
  serviceUuid: string
): Promise<void> {
  return NativeBlePeripheral.startAdvertising(localName, serviceUuid);
}

export function stopAdvertising(): Promise<void> {
  return NativeBlePeripheral.stopAdvertising();
}

export function sendNotification(
  characteristicUuid: string,
  data: number[]
): Promise<boolean> {
  return NativeBlePeripheral.sendNotification(characteristicUuid, data);
}

export function isAdvertising(): Promise<boolean> {
  return NativeBlePeripheral.isAdvertising();
}

export function onCentralConnected(
  listener: (event: CentralConnectedEvent) => void
): EventSubscription {
  return NativeBlePeripheral.addListener<CentralConnectedEvent>(
    "onCentralConnected",
    listener
  );
}

export function onCentralDisconnected(
  listener: (event: CentralDisconnectedEvent) => void
): EventSubscription {
  return NativeBlePeripheral.addListener<CentralDisconnectedEvent>(
    "onCentralDisconnected",
    listener
  );
}

export function onMessageReceived(
  listener: (event: MessageReceivedEvent) => void
): EventSubscription {
  return NativeBlePeripheral.addListener<MessageReceivedEvent>(
    "onMessageReceived",
    listener
  );
}
