import { parseProfilePdfFile } from "./lib/parsePdfBrowser.js";
import { loadFlagGraphic } from "./lib/flagSvgBrowser.js";
import { computeOverall, computeTier, computeArchetype } from "../src/scoring.js";
import { computeStatsFromPdfProfile } from "../src/pdf/scoringPdf.js";
import { guessCountryCode } from "../src/country.js";
import { renderCardStyled } from "../src/renderCardStyled.js";
import { renderCardBack } from "./cardBack.js";
import { initHeroShowcase } from "./heroShowcase.js";
import type { CardData, CardStyle } from "../src/types.js";

const heroShowcase = document.getElementById("hero-showcase") as HTMLDivElement;
initHeroShowcase(heroShowcase);

const setupPanel = document.getElementById("setup-panel") as HTMLElement;

const pdfDropZone = document.getElementById("pdf-drop-zone") as HTMLLabelElement;
const pdfDropLabel = document.getElementById("pdf-drop-label") as HTMLSpanElement;
const pdfInput = document.getElementById("pdf-input") as HTMLInputElement;
const PDF_DROP_DEFAULT = pdfDropLabel.textContent ?? "";

const styleFutBtn = document.getElementById("style-fut") as HTMLButtonElement;
const styleTcgBtn = document.getElementById("style-tcg") as HTMLButtonElement;

const statusEl = document.getElementById("status") as HTMLParagraphElement;
const resultEl = document.getElementById("result") as HTMLElement;
const cardFlip = document.getElementById("card-flip") as HTMLDivElement;
const cardFlipInner = document.getElementById("card-flip-inner") as HTMLDivElement;
const cardFront = document.getElementById("card-front") as HTMLDivElement;
const cardBack = document.getElementById("card-back") as HTMLDivElement;
const downloadBtn = document.getElementById("download-btn") as HTMLButtonElement;
const newCardBtn = document.getElementById("new-card-btn") as HTMLButtonElement;

let currentSvg = "";
let currentCardData: CardData | null = null;
let currentStyle: CardStyle = "fut";

function setStatus(message: string, isError = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle("error", isError);
}

const SQUEEZE_MS = 160;

function renderFrontAndBack() {
  if (!currentCardData) return;
  currentSvg = renderCardStyled(currentCardData, currentStyle);
  cardFront.innerHTML = currentSvg;
  cardBack.innerHTML = renderCardBack(currentCardData, currentStyle);
}

function setStyle(style: CardStyle) {
  currentStyle = style;
  styleFutBtn.classList.toggle("active", style === "fut");
  styleTcgBtn.classList.toggle("active", style === "tcg");
  styleFutBtn.setAttribute("aria-selected", String(style === "fut"));
  styleTcgBtn.setAttribute("aria-selected", String(style === "tcg"));
  renderFrontAndBack();
}

styleFutBtn.addEventListener("click", () => setStyle("fut"));
styleTcgBtn.addEventListener("click", () => setStyle("tcg"));

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

function resetToSetup() {
  resultEl.hidden = true;
  setupPanel.hidden = false;
  currentCardData = null;
  pdfInput.value = "";
  pdfDropLabel.textContent = PDF_DROP_DEFAULT;
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
  setStatus("Parsing the PDF locally… nothing is being uploaded.");
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
      stats,
      overall,
      tier,
      position,
      archetype,
      mode: "SCOUT",
    });
  } catch (err) {
    console.error(err);
    setStatus(`Couldn't parse that PDF: ${(err as Error).message}`, true);
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

downloadBtn.addEventListener("click", () => {
  const blob = new Blob([currentSvg], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "card.svg";
  a.click();
  URL.revokeObjectURL(url);
});
