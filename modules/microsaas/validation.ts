export function slugify(name: string) {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80)
    .replace(/-$/, "");
}

export function validUrl(value: string, httpsOnly = false) {
  try {
    const url = new URL(value);
    return (
      (httpsOnly
        ? url.protocol === "https:"
        : ["http:", "https:"].includes(url.protocol)) &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}

export function parseProduct(form: FormData) {
  const name = String(form.get("name") ?? "").trim();
  const slug = String(form.get("slug") ?? "").trim() || slugify(name);
  const description = String(form.get("description") ?? "").trim();
  const url = String(form.get("url") ?? "").trim();
  const status = String(form.get("status") ?? "active");
  if (!name || name.length > 120)
    throw new Error("Nama produk wajib diisi, maksimal 120 karakter.");
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) || slug.length > 80)
    throw new Error(
      "Slug harus berisi huruf kecil, angka, dan tanda hubung (maksimal 80 karakter).",
    );
  if (!validUrl(url) || url.length > 2048)
    throw new Error("Masukkan URL HTTP/HTTPS yang valid tanpa kredensial.");
  if (description.length > 2000)
    throw new Error("Deskripsi maksimal 2000 karakter.");
  if (!["active", "inactive"].includes(status))
    throw new Error("Status produk tidak valid.");
  return { name, slug, description: description || null, url, status };
}

export function logoExtension(bytes: Uint8Array, mime: string) {
  if (bytes.length > 1048576) throw new Error("Logo maksimal 1 MB.");
  if (
    mime === "image/png" &&
    [137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => bytes[i] === v)
  )
    return "png";
  if (
    mime === "image/jpeg" &&
    bytes[0] === 255 &&
    bytes[1] === 216 &&
    bytes[2] === 255
  )
    return "jpg";
  const ascii = (start: number, end: number) =>
    String.fromCharCode(...bytes.slice(start, end));
  if (
    mime === "image/webp" &&
    ascii(0, 4) === "RIFF" &&
    ascii(8, 12) === "WEBP"
  )
    return "webp";
  throw new Error("Gunakan file PNG, JPEG, atau WebP yang valid.");
}
