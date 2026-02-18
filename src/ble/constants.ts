export const SERVICE_UUID = "00001337-0000-1000-8000-00805f9b34fb";
export const MESSAGE_CHAR_UUID = "00001338-0000-1000-8000-00805f9b34fb";

export const LOCAL_NAME_PREFIX = "NM-";
export const DEVICE_ID_LENGTH = 4; // 4 bytes = 8 hex chars

export const MAX_MESSAGE_SIZE = 512;
export const DEFAULT_MTU = 20;

// Fragment header
export const FLAG_MORE_FRAGMENTS = 0x01;
export const FLAG_LAST_FRAGMENT = 0x00;
export const HEADER_SIZE = 3; // 1 byte flags + 2 bytes message ID
