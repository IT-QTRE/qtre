export function computeTargetDimensions(
  width: number,
  height: number,
  maxDimension: number,
): { width: number; height: number } {
  const longestEdge = Math.max(width, height);
  if (longestEdge <= maxDimension) {
    return { width, height };
  }
  const scale = maxDimension / longestEdge;
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}
