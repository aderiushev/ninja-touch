import {
  BleManager,
  Device,
  Characteristic,
  Subscription,
  BleError,
} from "react-native-ble-plx";
import { SERVICE_UUID, MESSAGE_CHAR_UUID } from "./constants";
import { bytesToBase64, base64ToBytes } from "./base64";

let manager: BleManager | null = null;

function getManager(): BleManager {
  if (!manager) {
    manager = new BleManager();
  }
  return manager;
}

export interface ScannedDevice {
  id: string;
  localName: string | null;
  rssi: number | null;
}

export function startScanning(
  onDeviceFound: (device: ScannedDevice) => void
): void {
  const mgr = getManager();
  mgr.startDeviceScan(
    [SERVICE_UUID],
    { allowDuplicates: false },
    (error: BleError | null, device: Device | null) => {
      if (error || !device) return;
      onDeviceFound({
        id: device.id,
        localName: device.localName ?? device.name,
        rssi: device.rssi,
      });
    }
  );
}

export function stopScanning(): void {
  getManager().stopDeviceScan();
}

export async function connectToPeripheral(deviceId: string): Promise<Device> {
  const mgr = getManager();
  const device = await mgr.connectToDevice(deviceId, {
    requestMTU: 512,
    timeout: 10000,
  });
  await device.discoverAllServicesAndCharacteristics();
  return device;
}

export function subscribeToMessages(
  deviceId: string,
  onMessage: (data: number[]) => void
): Subscription {
  const mgr = getManager();
  return mgr.monitorCharacteristicForDevice(
    deviceId,
    SERVICE_UUID,
    MESSAGE_CHAR_UUID,
    (error: BleError | null, characteristic: Characteristic | null) => {
      if (error || !characteristic?.value) return;
      const bytes = base64ToBytes(characteristic.value);
      onMessage(bytes);
    }
  );
}

export async function sendMessage(
  deviceId: string,
  data: number[]
): Promise<void> {
  const mgr = getManager();
  const base64 = bytesToBase64(data);
  await mgr.writeCharacteristicWithResponseForDevice(
    deviceId,
    SERVICE_UUID,
    MESSAGE_CHAR_UUID,
    base64
  );
}

export async function disconnect(deviceId: string): Promise<void> {
  const mgr = getManager();
  try {
    await mgr.cancelDeviceConnection(deviceId);
  } catch {
    // Already disconnected
  }
}

export function onDeviceDisconnected(
  deviceId: string,
  callback: () => void
): Subscription {
  const mgr = getManager();
  return mgr.onDeviceDisconnected(deviceId, () => {
    callback();
  });
}

export type BluetoothState =
  | "Unknown"
  | "Resetting"
  | "Unsupported"
  | "Unauthorized"
  | "PoweredOff"
  | "PoweredOn";

export function monitorBluetoothState(
  callback: (state: BluetoothState) => void
): Subscription {
  const mgr = getManager();
  return mgr.onStateChange((state) => {
    callback(state as BluetoothState);
  }, true);
}

export function destroyManager(): void {
  if (manager) {
    manager.destroy();
    manager = null;
  }
}
