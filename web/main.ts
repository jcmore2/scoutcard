import { parseExportFile } from "./lib/parseExportBrowser.js";
import { computeStats, computeOverall, computeTier, computeArchetype } from "../src/scoring.js";
import { renderCard } from "../src/renderCard.js";
import type { CardData } from "../src/types.js";

const dropZone = document.getElementById("drop-zone") as HTMLLabelElement;
const dropLabel = document.getElementById("drop-label") as HTMLSpanElement;
const fileInput = document.getElementById("file-input") as HTMLInputElement;
const countryInput = document.getElementById("country-input") as HTMLInputElement;
const statusEl = document.getElementById("status") as HTMLParagraphElement;
const resultEl = document.getElementById("result") as HTMLElement;
const cardContainer = document.getElementById("card-container") as HTMLDivElement;
const downloadBtn = document.getElementById("download-btn") as HTMLButtonElement;

let currentSvg = "";

function setStatus(message: string, isError = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle("error", isError);
}

async function handleFile(file: File) {
  if (!file.name.toLowerCase().endsWith(".zip")) {
    setStatus("That doesn't look like a .zip file — export your data from LinkedIn first.", true);
    return;
  }

  dropLabel.textContent = file.name;
  setStatus("Parsing your export locally… nothing is being uploaded.");
  resultEl.hidden = true;

  try {
    const profile = await parseExportFile(file);
    const stats = computeStats(profile);
    const overall = computeOverall(stats);
    const tier = computeTier(overall);
    const { position, archetype } = computeArchetype(stats);

    const cardData: CardData = {
      name: `${profile.firstName} ${profile.lastName}`.trim() || "Unknown",
      headline: profile.headline,
      country: countryInput.value.trim().toUpperCase(),
      stats,
      overall,
      tier,
      position,
      archetype,
    };

    currentSvg = renderCard(cardData);
    cardContainer.innerHTML = currentSvg;
    resultEl.hidden = false;
    setStatus(`Scouted ${cardData.name || "your profile"} — overall ${overall}, ${tier}.`);
  } catch (err) {
    console.error(err);
    setStatus(`Couldn't parse that export: ${(err as Error).message}`, true);
  }
}

dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.classList.add("dragover");
});
dropZone.addEventListener("dragleave", () => dropZone.classList.remove("dragover"));
dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.classList.remove("dragover");
  const file = e.dataTransfer?.files[0];
  if (file) handleFile(file);
});

fileInput.addEventListener("change", () => {
  const file = fileInput.files?.[0];
  if (file) handleFile(file);
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
