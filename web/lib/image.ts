export const getImageUrl = (path: string | null) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/api$/, "");
  return `${baseUrl}${path}`;
};
