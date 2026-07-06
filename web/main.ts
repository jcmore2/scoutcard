import { parseExportFile } from "./lib/parseExportBrowser.js";
import { parseProfilePdfFile } from "./lib/parsePdfBrowser.js";
import { computeStats, computeOverall, computeTier, computeArchetype } from "../src/scoring.js";
import { computeStatsFromPdfProfile } from "../src/pdf/scoringPdf.js";
import { renderCard } from "../src/renderCard.js";
import { renderCardBack } from "./cardBack.js";
import type { CardData } from "../src/types.js";

const tabFull = document.getElementById("tab-full") as HTMLButtonElement;
const tabScout = document.getElementById("tab-scout") as HTMLButtonElement;
const panelFull = document.getElementById("panel-full") as HTMLElement;
const panelScout = document.getElementById("panel-scout") as HTMLElement;

const zipDropZone = document.getElementById("zip-drop-zone") as HTMLLabelElement;
const zipDropLabel = document.getElementById("zip-drop-label") as HTMLSpanElement;
const zipInput = document.getElementById("zip-input") as HTMLInputElement;

const pdfDropZone = document.getElementById("pdf-drop-zone") as HTMLLabelElement;
const pdfDropLabel = document.getElementById("pdf-drop-label") as HTMLSpanElement;
const pdfInput = document.getElementById("pdf-input") as HTMLInputElement;

const countryInput = document.getElementById("country-input") as HTMLInputElement;
const statusEl = document.getElementById("status") as HTMLParagraphElement;
const resultEl = document.getElementById("result") as HTMLElement;
const cardFlip = document.getElementById("card-flip") as HTMLDivElement;
const cardFlipInner = document.getElementById("card-flip-inner") as HTMLDivElement;
const cardFront = document.getElementById("card-front") as HTMLDivElement;
const cardBack = document.getElementById("card-back") as HTMLDivElement;
const downloadBtn = document.getElementById("download-btn") as HTMLButtonElement;

let currentSvg = "";

function setStatus(message: string, isError = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle("error", isError);
}

function switchTab(mode: "full" | "scout") {
  const showFull = mode === "full";
  tabFull.classList.toggle("active", showFull);
  tabScout.classList.toggle("active", !showFull);
  tabFull.setAttribute("aria-selected", String(showFull));
  tabScout.setAttribute("aria-selected", String(!showFull));
  panelFull.hidden = !showFull;
  panelScout.hidden = showFull;
  setStatus("");
  resultEl.hidden = true;
}

tabFull.addEventListener("click", () => switchTab("full"));
tabScout.addEventListener("click", () => switchTab("scout"));

const SQUEEZE_MS = 160;

function renderAndShow(cardData: CardData) {
  currentSvg = renderCard(cardData);
  cardFront.innerHTML = currentSvg;
  cardBack.innerHTML = renderCardBack(cardData);
  cardFront.hidden = false;
  cardBack.hidden = true;
  cardFlipInner.classList.remove("squeezed");
  resultEl.hidden = false;
  setStatus(`Scouted ${cardData.name || "your profile"} — overall ${cardData.overall}, ${cardData.tier} (${cardData.mode}).`);
}

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

async function handleZipFile(file: File) {
  if (!file.name.toLowerCase().endsWith(".zip")) {
    setStatus("That doesn't look like a .zip file — export your data from LinkedIn first.", true);
    return;
  }
  zipDropLabel.textContent = file.name;
  setStatus("Parsing your export locally… nothing is being uploaded.");
  resultEl.hidden = true;

  try {
    const profile = await parseExportFile(file);
    const stats = computeStats(profile);
    const overall = computeOverall(stats);
    const tier = computeTier(overall);
    const { position, archetype } = computeArchetype(stats);

    renderAndShow({
      name: `${profile.firstName} ${profile.lastName}`.trim() || "Unknown",
      headline: profile.headline,
      country: countryInput.value.trim().toUpperCase(),
      stats,
      overall,
      tier,
      position,
      archetype,
      mode: "FULL",
    });
  } catch (err) {
    console.error(err);
    setStatus(`Couldn't parse that export: ${(err as Error).message}`, true);
  }
}

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

    renderAndShow({
      name: profile.name || "Unknown",
      headline: profile.headline,
      country: countryInput.value.trim().toUpperCase(),
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

wireDropZone(zipDropZone, zipInput, handleZipFile);
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
