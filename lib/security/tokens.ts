import crypto from "node:crypto";

const ALGORITHM = "aes-256-gcm";

function getEncryptionKey() {
  const secret = process.env.TOKEN_ENCRYPTION_KEY;
  if (!secret) return null;
  return crypto.createHash("sha256").update(secret).digest();
}

export function encryptSecret(value: string) {
  const key = getEncryptionKey();
  if (!key) return null;

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [iv.toString("base64url"), tag.toString("base64url"), encrypted.toString("base64url")].join(".");
}

export function decryptSecret(value?: string | null) {
  const key = getEncryptionKey();
  if (!key || !value) return null;

  try {
    const [ivValue, tagValue, encryptedValue] = value.split(".");
    if (!ivValue || !tagValue || !encryptedValue) return null;
    const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(ivValue, "base64url"));
    decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedValue, "base64url")),
      decipher.final(),
    ]);
    return decrypted.toString("utf8");
  } catch {
    return null;
  }
}

export function canStoreEncryptedSecrets() {
  return Boolean(getEncryptionKey());
}
