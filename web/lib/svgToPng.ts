// Rasterizes a card SVG string (front or back) to a PNG blob, for contexts
// that need a real image file rather than markup — namely sharing via the
// Web Share API, which can attach files but not inline SVG/HTML. Renders at
// a fixed multiplier over the card's native 340x480 viewBox so the shared
// image still looks sharp on a phone screen.
const SCALE = 2.5;
const CARD_WIDTH = 340;
const CARD_HEIGHT = 480;

export async function svgToPngBlob(svg: string): Promise<Blob> {
  const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const svgUrl = URL.createObjectURL(svgBlob);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Failed to rasterize card SVG"));
      img.src = svgUrl;
    });

    const canvas = document.createElement("canvas");
    canvas.width = CARD_WIDTH * SCALE;
    canvas.height = CARD_HEIGHT * SCALE;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable");
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) throw new Error("Failed to encode card PNG");
    return blob;
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}
