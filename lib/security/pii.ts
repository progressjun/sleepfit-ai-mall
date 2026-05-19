const emailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const phonePattern = /(?:\+82[-\s]?)?0?1[016789][-\s]?\d{3,4}[-\s]?\d{4}/g;
const orderPattern = /\b(?:ORD|ORDER|주문|주문번호)[-_:\s]?[A-Z0-9-]{6,}\b/gi;
const addressPattern =
  /([가-힣A-Za-z0-9]+(?:시|도)\s+[가-힣A-Za-z0-9]+(?:구|군|시)\s+[^\n,]{4,})/g;

export function maskEmail(value: string) {
  return value.replace(emailPattern, "[masked-email]");
}

export function maskPhone(value: string) {
  return value.replace(phonePattern, "[masked-phone]");
}

export function maskOrderNumber(value: string) {
  return value.replace(orderPattern, "[masked-order]");
}

export function maskAddressLikeText(value: string) {
  return value.replace(addressPattern, "[masked-address]");
}

function maskText(value: string) {
  return maskAddressLikeText(maskOrderNumber(maskPhone(maskEmail(value))));
}

export function maskPIIInObject<T>(input: T): T {
  if (typeof input === "string") {
    return maskText(input) as T;
  }

  if (Array.isArray(input)) {
    return input.map((item) => maskPIIInObject(item)) as T;
  }

  if (input && typeof input === "object") {
    return Object.fromEntries(
      Object.entries(input).map(([key, value]) => [key, maskPIIInObject(value)]),
    ) as T;
  }

  return input;
}
