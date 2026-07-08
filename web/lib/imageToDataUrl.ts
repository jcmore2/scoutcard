// Converts a user-picked photo into a small, square, embeddable data URI —
// cover-cropped to a square (matching the circular/rectangular photo slots
// on the cards) and capped in size so a multi-MB phone photo doesn't bloat
// the generated SVG. Runs entirely client-side, same as everything else
// here — the photo never leaves the browser.
const MAX_SIDE = 480;

export async function fileToSquareDataUrl(file: File): Promise<string> {
  const rawDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.readAsDataURL(file);
  });

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = rawDataUrl;
  });

  const side = Math.min(image.width, image.height, MAX_SIDE);
  const sourceSide = Math.min(image.width, image.height);
  const sx = (image.width - sourceSide) / 2;
  const sy = (image.height - sourceSide) / 2;

  const canvas = document.createElement("canvas");
  canvas.width = side;
  canvas.height = side;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");
  ctx.drawImage(image, sx, sy, sourceSide, sourceSide, 0, 0, side, side);

  return canvas.toDataURL("image/jpeg", 0.85);
}
