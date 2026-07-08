import { renderCard } from "./renderCard.js";
import { renderCardTcg } from "./renderCardTcg.js";
import { renderBaseball } from "./renderBaseball.js";
import type { CardData, CardStyle } from "./types.js";

export function renderCardStyled(data: CardData, style: CardStyle): string {
  if (style === "tcg") return renderCardTcg(data);
  if (style === "baseball") return renderBaseball(data);
  return renderCard(data);
}
