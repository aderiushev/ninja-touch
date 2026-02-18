const CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

export function bytesToBase64(bytes: number[]): string {
  let result = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const b2 = i + 2 < bytes.length ? bytes[i + 2] : 0;
    result += CHARS[b0 >> 2];
    result += CHARS[((b0 & 3) << 4) | (b1 >> 4)];
    result += i + 1 < bytes.length ? CHARS[((b1 & 15) << 2) | (b2 >> 6)] : "=";
    result += i + 2 < bytes.length ? CHARS[b2 & 63] : "=";
  }
  return result;
}

export function base64ToBytes(base64: string): number[] {
  const lookup = new Uint8Array(128);
  for (let i = 0; i < CHARS.length; i++) {
    lookup[CHARS.charCodeAt(i)] = i;
  }

  const stripped = base64.replace(/=+$/, "");
  const bytes: number[] = [];
  for (let i = 0; i < stripped.length; i += 4) {
    const b0 = lookup[stripped.charCodeAt(i)];
    const b1 = lookup[stripped.charCodeAt(i + 1)];
    const b2 = i + 2 < stripped.length ? lookup[stripped.charCodeAt(i + 2)] : 0;
    const b3 = i + 3 < stripped.length ? lookup[stripped.charCodeAt(i + 3)] : 0;
    bytes.push((b0 << 2) | (b1 >> 4));
    if (i + 2 < stripped.length) bytes.push(((b1 & 15) << 4) | (b2 >> 2));
    if (i + 3 < stripped.length) bytes.push(((b2 & 3) << 6) | b3);
  }
  return bytes;
}
