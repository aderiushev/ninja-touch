import {
  FLAG_MORE_FRAGMENTS,
  FLAG_LAST_FRAGMENT,
  HEADER_SIZE,
  MAX_MESSAGE_SIZE,
  DEFAULT_MTU,
} from "./constants";

let nextMessageId = 0;

function getNextMessageId(): number {
  const id = nextMessageId;
  nextMessageId = (nextMessageId + 1) & 0xffff;
  return id;
}

export function encodeMessage(text: string, mtu: number = DEFAULT_MTU): number[][] {
  const encoder = new TextEncoder();
  const payload = encoder.encode(text.slice(0, MAX_MESSAGE_SIZE));
  const chunkSize = Math.max(mtu - HEADER_SIZE, 1);
  const messageId = getNextMessageId();

  if (payload.length <= chunkSize) {
    return [buildFragment(FLAG_LAST_FRAGMENT, messageId, Array.from(payload))];
  }

  const fragments: number[][] = [];
  for (let offset = 0; offset < payload.length; offset += chunkSize) {
    const end = Math.min(offset + chunkSize, payload.length);
    const isLast = end >= payload.length;
    const flag = isLast ? FLAG_LAST_FRAGMENT : FLAG_MORE_FRAGMENTS;
    fragments.push(
      buildFragment(flag, messageId, Array.from(payload.slice(offset, end)))
    );
  }
  return fragments;
}

function buildFragment(
  flag: number,
  messageId: number,
  payload: number[]
): number[] {
  return [flag, (messageId >> 8) & 0xff, messageId & 0xff, ...payload];
}

export interface ReassemblyBuffer {
  fragments: Map<number, number[][]>;
}

export function createReassemblyBuffer(): ReassemblyBuffer {
  return { fragments: new Map() };
}

export function feedFragment(
  buffer: ReassemblyBuffer,
  data: number[]
): string | null {
  if (data.length < HEADER_SIZE) return null;

  const flag = data[0];
  const messageId = (data[1] << 8) | data[2];
  const payload = data.slice(HEADER_SIZE);

  if (flag === FLAG_LAST_FRAGMENT && !buffer.fragments.has(messageId)) {
    // Single-fragment message
    return new TextDecoder().decode(new Uint8Array(payload));
  }

  if (!buffer.fragments.has(messageId)) {
    buffer.fragments.set(messageId, []);
  }
  buffer.fragments.get(messageId)!.push(payload);

  if (flag === FLAG_LAST_FRAGMENT) {
    const parts = buffer.fragments.get(messageId)!;
    buffer.fragments.delete(messageId);
    const combined = parts.flat();
    return new TextDecoder().decode(new Uint8Array(combined));
  }

  return null;
}
