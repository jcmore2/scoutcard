import { parseProfilePdfFile } from "./lib/parsePdfBrowser.js";
import { loadFlagGraphic } from "./lib/flagSvgBrowser.js";
import { svgToPngBlob } from "./lib/svgToPng.js";
import { fileToSquareDataUrl } from "./lib/imageToDataUrl.js";
import { computeOverall, computeTier, computeArchetype } from "../src/scoring.js";
import { computeStatsFromPdfProfile } from "../src/pdf/scoringPdf.js";
import { guessCountryCode } from "../src/country.js";
import { renderCardStyled } from "../src/renderCardStyled.js";
import { renderCardBack } from "./cardBack.js";
import { initHeroShowcase } from "./heroShowcase.js";
import type { CardData, CardStyle } from "../src/types.js";

const SITE_URL = "https://jcmore2.github.io/scoutcard/";

const heroShowcase = document.getElementById("hero-showcase") as HTMLDivElement;
initHeroShowcase(heroShowcase);

const setupPanel = document.getElementById("setup-panel") as HTMLElement;

const pdfDropZone = document.getElementById("pdf-drop-zone") as HTMLLabelElement;
const pdfDropLabel = document.getElementById("pdf-drop-label") as HTMLSpanElement;
const pdfInput = document.getElementById("pdf-input") as HTMLInputElement;
const PDF_DROP_DEFAULT = pdfDropLabel.textContent ?? "";

const photoDropZone = document.getElementById("photo-drop-zone") as HTMLLabelElement;
const photoDropLabel = document.getElementById("photo-drop-label") as HTMLSpanElement;
const photoInput = document.getElementById("photo-input") as HTMLInputElement;
const removePhotoBtn = document.getElementById("remove-photo-btn") as HTMLButtonElement;
const PHOTO_DROP_DEFAULT = photoDropLabel.textContent ?? "";

const styleFutBtn = document.getElementById("style-fut") as HTMLButtonElement;
const styleTcgBtn = document.getElementById("style-tcg") as HTMLButtonElement;
const styleBaseballBtn = document.getElementById("style-baseball") as HTMLButtonElement;
const styleButtons: Record<CardStyle, HTMLButtonElement> = {
  fut: styleFutBtn,
  tcg: styleTcgBtn,
  baseball: styleBaseballBtn,
};

const spinner = document.getElementById("spinner") as HTMLDivElement;
const statusEl = document.getElementById("status") as HTMLParagraphElement;
const resultEl = document.getElementById("result") as HTMLElement;
const cardFlip = document.getElementById("card-flip") as HTMLDivElement;
const cardFlipInner = document.getElementById("card-flip-inner") as HTMLDivElement;
const cardFront = document.getElementById("card-front") as HTMLDivElement;
const cardBack = document.getElementById("card-back") as HTMLDivElement;
const downloadBtn = document.getElementById("download-btn") as HTMLButtonElement;
const newCardBtn = document.getElementById("new-card-btn") as HTMLButtonElement;
const shareLinkedInBtn = document.getElementById("share-linkedin") as HTMLButtonElement;
const shareInstagramBtn = document.getElementById("share-instagram") as HTMLButtonElement;
const shareTiktokBtn = document.getElementById("share-tiktok") as HTMLButtonElement;

let currentSvg = "";
let currentCardData: CardData | null = null;
let currentStyle: CardStyle = "fut";

function setStatus(message: string, isError = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle("error", isError);
}

function setLoading(isLoading: boolean) {
  spinner.hidden = !isLoading;
}

const SQUEEZE_MS = 160;
const COUNT_UP_MS = 700;

// Numbers in the downloaded card.svg always show their real value (so it
// looks right with no JS at all) — this just replays them from 0 for the
// live page, using each element's own data-count-to as the target.
function animateCountUp(root: ParentNode) {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const elements = root.querySelectorAll<SVGTextElement>("[data-count-to]");
  elements.forEach((el) => {
    const target = parseInt(el.getAttribute("data-count-to") ?? "", 10);
    if (Number.isNaN(target)) return;
    if (prefersReducedMotion) {
      el.textContent = String(target);
      return;
    }
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / COUNT_UP_MS);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = String(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(tick);
      else el.textContent = String(target);
    };
    el.textContent = "0";
    requestAnimationFrame(tick);
  });
}

function renderFrontAndBack() {
  if (!currentCardData) return;
  currentSvg = renderCardStyled(currentCardData, currentStyle);
  cardFront.innerHTML = currentSvg;
  cardBack.innerHTML = renderCardBack(currentCardData, currentStyle);
  animateCountUp(cardFront);
}

function setStyle(style: CardStyle) {
  currentStyle = style;
  (Object.keys(styleButtons) as CardStyle[]).forEach((key) => {
    styleButtons[key].classList.toggle("active", key === style);
    styleButtons[key].setAttribute("aria-selected", String(key === style));
  });
  renderFrontAndBack();
}

styleFutBtn.addEventListener("click", () => setStyle("fut"));
styleTcgBtn.addEventListener("click", () => setStyle("tcg"));
styleBaseballBtn.addEventListener("click", () => setStyle("baseball"));

function triggerRevealAnimation() {
  // Remove-then-reflow-then-add so the animation restarts even if the
  // classes were already present from a previous reveal.
  cardFlipInner.classList.remove("reveal");
  cardFront.classList.remove("shine");
  void cardFlipInner.offsetWidth;
  cardFlipInner.classList.add("reveal");
  cardFront.classList.add("shine");
  window.setTimeout(() => cardFront.classList.remove("shine"), 1200);
}

function renderAndShow(cardData: CardData) {
  currentCardData = cardData;
  renderFrontAndBack();
  cardFront.hidden = false;
  cardBack.hidden = true;
  cardFlipInner.classList.remove("squeezed");
  setupPanel.hidden = true;
  resultEl.hidden = false;
  triggerRevealAnimation();
  setStatus(`Scouted ${cardData.name || "your profile"} — overall ${cardData.overall}, ${cardData.tier} (${cardData.mode}).`);
}

function resetPhotoUploader() {
  photoInput.value = "";
  photoDropLabel.textContent = PHOTO_DROP_DEFAULT;
  removePhotoBtn.hidden = true;
}

function resetToSetup() {
  resultEl.hidden = true;
  setupPanel.hidden = false;
  currentCardData = null;
  pdfInput.value = "";
  pdfDropLabel.textContent = PDF_DROP_DEFAULT;
  resetPhotoUploader();
  setStatus("");
}

newCardBtn.addEventListener("click", resetToSetup);

function toggleFlip() {
  cardFlipInner.classList.add("squeezed");
  window.setTimeout(() => {
    const showingFront = !cardFront.hidden;
    cardFront.hidden = showingFront;
    cardBack.hidden = !showingFront;
    cardFlipInner.classList.remove("squeezed");
  }, SQUEEZE_MS);
}

cardFlip.addEventListener("click", toggleFlip);
cardFlip.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    toggleFlip();
  }
});

async function handlePdfFile(file: File) {
  if (!file.name.toLowerCase().endsWith(".pdf")) {
    setStatus("That doesn't look like a .pdf file — use LinkedIn's \"Save to PDF\" option.", true);
    return;
  }
  pdfDropLabel.textContent = file.name;
  setStatus("Reading your PDF locally — nothing is uploaded anywhere…");
  setLoading(true);
  resultEl.hidden = true;

  try {
    const profile = await parseProfilePdfFile(file);
    const stats = computeStatsFromPdfProfile(profile);
    const overall = computeOverall(stats);
    const tier = computeTier(overall);
    const { position, archetype } = computeArchetype(stats);
    const country = guessCountryCode(profile.location) ?? "";
    const flag = await loadFlagGraphic(country);

    renderAndShow({
      name: profile.name || "Unknown",
      headline: profile.headline,
      company: profile.company,
      country,
      flag,
      profileUrl: profile.profileUrl,
      stats,
      overall,
      tier,
      position,
      archetype,
      mode: "SCOUT",
      photo: null,
    });
  } catch (err) {
    console.error(err);
    setStatus(
      `Couldn't read that PDF (${(err as Error).message}). Make sure it's an unmodified "Save to PDF" export from a LinkedIn profile, then try again.`,
      true,
    );
  } finally {
    setLoading(false);
  }
}

function wireDropZone(zone: HTMLLabelElement, input: HTMLInputElement, handler: (file: File) => void) {
  zone.addEventListener("dragover", (e) => {
    e.preventDefault();
    zone.classList.add("dragover");
  });
  zone.addEventListener("dragleave", () => zone.classList.remove("dragover"));
  zone.addEventListener("drop", (e) => {
    e.preventDefault();
    zone.classList.remove("dragover");
    const file = e.dataTransfer?.files[0];
    if (file) handler(file);
  });
  input.addEventListener("change", () => {
    const file = input.files?.[0];
    if (file) handler(file);
  });
}

wireDropZone(pdfDropZone, pdfInput, handlePdfFile);

// Purely cosmetic and entirely optional — LinkedIn data never includes a
// photo (see README's "Flag and company, but no photo or logo"), so this is
// the only way a card gets one, and only ever from a file the user picks
// themselves, processed locally like everything else here.
async function handlePhotoFile(file: File) {
  if (!file.type.startsWith("image/")) {
    setStatus("That doesn't look like an image file.", true);
    return;
  }
  if (!currentCardData) return;

  try {
    const dataUrl = await fileToSquareDataUrl(file);
    currentCardData.photo = dataUrl;
    photoDropLabel.textContent = file.name;
    removePhotoBtn.hidden = false;
    renderFrontAndBack();
  } catch (err) {
    console.error(err);
    setStatus(`Couldn't read that image (${(err as Error).message}).`, true);
  }
}

wireDropZone(photoDropZone, photoInput, handlePhotoFile);

removePhotoBtn.addEventListener("click", () => {
  if (!currentCardData) return;
  currentCardData.photo = null;
  resetPhotoUploader();
  renderFrontAndBack();
});

downloadBtn.addEventListener("click", () => {
  const blob = new Blob([currentSvg], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "card.svg";
  a.click();
  URL.revokeObjectURL(url);
});

function shareText(): string {
  if (!currentCardData) return "I just scouted my career with ScoutCard ⚽";
  return `I just scouted my career with ScoutCard — overall ${currentCardData.overall}, ${currentCardData.tier} 🃏`;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

type ShareNetwork = "linkedin" | "instagram" | "tiktok";

function openLinkedInIntent() {
  const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(SITE_URL)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

// LinkedIn's web share intent only takes a text + link — it can't attach a
// file to the compose window, and there's no backend here to host a
// per-card image at a stable URL for its link-preview scraper either.
// Instagram and TikTok don't even have a web compose intent to fall back
// to — they're mobile-app-first and expose no URL scheme for pre-filled
// sharing at all. So the real card images go out through the Web Share API
// instead, which *can* attach files and hands the user's OS the actual
// front+back PNGs to share to whichever app they pick, all three included.
// Where that's unsupported (most desktop browsers today), fall back to
// downloading both images — for LinkedIn there's at least a compose window
// to open afterward, for Instagram/TikTok there's nothing left to automate.
async function shareCard(network: ShareNetwork) {
  if (!currentCardData) return;

  const backSvg = renderCardBack(currentCardData, currentStyle);
  const [frontBlob, backBlob] = await Promise.all([svgToPngBlob(currentSvg), svgToPngBlob(backSvg)]);
  const frontFile = new File([frontBlob], "scoutcard-front.png", { type: "image/png" });
  const backFile = new File([backBlob], "scoutcard-back.png", { type: "image/png" });
  const files = [frontFile, backFile];

  if (navigator.canShare?.({ files })) {
    try {
      await navigator.share({ files, title: "My ScoutCard", text: shareText() });
      return;
    } catch (err) {
      if ((err as Error).name === "AbortError") return; // user cancelled the share sheet
      console.error(err);
    }
  }

  downloadBlob(frontFile, frontFile.name);
  downloadBlob(backFile, backFile.name);

  if (network === "linkedin") {
    openLinkedInIntent();
    setStatus(`Downloaded ${frontFile.name} and ${backFile.name} — attach them to your post, LinkedIn won't pull them in from a link.`);
  } else {
    const networkLabel = network === "instagram" ? "Instagram" : "TikTok";
    setStatus(`Downloaded ${frontFile.name} and ${backFile.name} — open ${networkLabel} and share them from there, it doesn't support sharing from a browser.`);
  }
}

shareLinkedInBtn.addEventListener("click", () => void shareCard("linkedin"));
shareInstagramBtn.addEventListener("click", () => void shareCard("instagram"));
shareTiktokBtn.addEventListener("click", () => void shareCard("tiktok"));
