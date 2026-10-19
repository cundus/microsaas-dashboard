import "server-only";
import { createCipheriv, randomBytes } from "node:crypto";

export function encryptSecret(value: string, context: string) {
  const key = Buffer.from(process.env.MICROSAAS_ENCRYPTION_KEY ?? "", "base64");
  if (key.length !== 32)
    throw new Error(
      "Atur MICROSAAS_ENCRYPTION_KEY (32 byte base64) di server sebelum menyimpan API key.",
    );
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(Buffer.from(context));
  const encrypted = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);
  return [
    "v1",
    iv.toString("base64"),
    cipher.getAuthTag().toString("base64"),
    encrypted.toString("base64"),
  ].join(".");
}
