import * as BlePeripheral from "../../modules/ble-peripheral";
import { SERVICE_UUID, MESSAGE_CHAR_UUID } from "./constants";
import type { EventSubscription } from "expo-modules-core";

export function startAdvertising(localName: string): Promise<void> {
  return BlePeripheral.startAdvertising(localName, SERVICE_UUID);
}

export function stopAdvertising(): Promise<void> {
  return BlePeripheral.stopAdvertising();
}

export function sendNotification(data: number[]): Promise<boolean> {
  return BlePeripheral.sendNotification(MESSAGE_CHAR_UUID, data);
}

export function onCentralConnected(
  cb: (centralId: string) => void
): EventSubscription {
  return BlePeripheral.onCentralConnected((e) => cb(e.centralId));
}

export function onCentralDisconnected(
  cb: (centralId: string) => void
): EventSubscription {
  return BlePeripheral.onCentralDisconnected((e) => cb(e.centralId));
}

export function onMessageReceived(
  cb: (data: number[]) => void
): EventSubscription {
  return BlePeripheral.onMessageReceived((e) => cb(e.data));
}
