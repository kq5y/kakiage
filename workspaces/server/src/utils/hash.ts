export const getHashHex = async (input: string, algorithm: string = "SHA-256") => {
  const digest = await crypto.subtle.digest(algorithm, new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
};
