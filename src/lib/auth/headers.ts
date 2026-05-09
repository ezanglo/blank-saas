/** `next/headers` `headers()` return value (minimal surface for conversion). */
interface NextHeaderList {
  forEach(callback: (value: string, name: string) => void): void;
}

export function headersToWebRequestHeaders(headers: NextHeaderList) {
  const out = new Headers();
  headers.forEach((value, key) => {
    out.append(key, value);
  });
  return out;
}
