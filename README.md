# ScoutCard

Turn your work history into a collectible stat card, FIFA/FUT-style — built
as an MVP exploring whether this can run on **just GitHub as infrastructure**
(no server, no database, no hosting bill).

**[Try it → jcmore2.github.io/scoutcard](https://jcmore2.github.io/scoutcard/)**
— drop a LinkedIn "Save to PDF" export, get a card instantly, nothing ever
leaves your browser.

This is a companion experiment to [GitFut](https://github.com/Younesfdj/gitfut),
which does the same thing for GitHub profiles. GitFut can query GitHub's free
public API live for anyone; LinkedIn exposes no such API, so ScoutCard works
from **your own official data export**, or **any public profile's "Save to
PDF" export**, instead of scraping.

## What it does

Feed it LinkedIn data and it scores six FIFA-style stats (PAC/SHO/PAS/DRI/DEF/PHY),
an overall rating, a rarity tier (Bronze → Icon), and a scouted position +
archetype (e.g. `ST` / "Poacher") — then renders the result as an SVG stat
card in one of three visual styles. The card is a flat, shareable file: embed
it in a GitHub README, download it, or view it live in the web app.

## Two ways to scout a profile

| | **Full export** (`.zip`) | **Scout** (`.pdf`) |
|---|---|---|
| Source | LinkedIn's official data export | "Save to PDF" button on a profile page |
| Whose profile? | **Only your own** (it's your account's data) | **Anyone's public profile** you can view |
| Signals | Connections, endorsements, recommendations, posting activity, full skill list, tenure | Career history/tenure, top 3 skills, certifications, languages, education — no social-proof metrics |
| Card badge | `FULL EXPORT` | `PDF SCOUT` |
| Available in | CLI only | CLI and the web app |

Scout mode is the one comparable to GitFut's "look up anyone" experience —
LinkedIn has no public API for that, but "Save to PDF" is a real,
always-available profile-page feature, not scraping. Its signals are much
thinner, so it uses a **separate scoring formula**
([src/pdf/scoringPdf.ts](src/pdf/scoringPdf.ts)) rather than forcing PDF data
into the full-export formula. It's also the only mode the web app offers —
the full-export flow needs your own account data, which doesn't add much for
a public drop-a-file-and-go tool, so that path stays CLI-only.

**Use this respectfully** — being able to view someone's public profile
doesn't mean turning it into a stat card is something they'd expect or want.
Prefer scouting your own profile, or get a person's OK before generating a
card of theirs.

## Web app

Drop a "Save to PDF" export onto **[jcmore2.github.io/scoutcard](https://jcmore2.github.io/scoutcard/)**.
It's a static page (built by GitHub Actions, hosted on GitHub Pages) that
parses everything client-side — nothing is ever uploaded anywhere, not even
to this project. Close the tab and the data is gone.

- **Flip the card** to see what each stat measures and what the tier bands
  mean. The back matches whichever front style is active
  ([web/cardBack.ts](web/cardBack.ts) reuses the fronts' shape/palette
  constants via an SVG `foreignObject`, so the stat list can still be laid
  out with regular HTML/CSS). This is web-app-only — the embeddable
  `card.svg` (front side only) is a static image.
- **Switch styles** — the same scored data re-renders instantly, no
  re-upload needed:
  - **FIFA/FUT** ([src/renderCard.ts](src/renderCard.ts)) — shield silhouette, all 6 stats on the front.
  - **Trading-card-game** ([src/renderCardTcg.ts](src/renderCardTcg.ts)) — each stat reads as an "attack" with its own energy-type color.
  - **Baseball** ([src/renderBaseball.ts](src/renderBaseball.ts)) — classic sports-card split: front is just identity (photo, name, team, one headline stat), full 6-stat breakdown lives on the back.

  All three are original layouts inspired by those formats, not any
  officially licensed card set, and say so on the card itself. Stat numbers
  count up from 0 on first render or style switch — a browser-only touch;
  downloaded SVGs always show the real value immediately.
- **Everything else**: a spinner while the PDF parses, a clear error box (icon
  + concrete next step) for an invalid file, an icon-based walkthrough of
  where "Save to PDF" lives on a profile page, and LinkedIn/Instagram/TikTok
  share buttons. None of the three can attach a file from a plain link —
  LinkedIn's web share intent only takes a text + URL, and Instagram/TikTok
  don't expose a web compose intent at all, being mobile-app-first — and
  there's no per-card URL to point any of them at either since nothing is
  ever stored. So sharing instead rasterizes the current front and back to
  PNGs and hands them to the OS via the [Web
  Share API](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share)
  where supported, so the user picks whichever app from their native share
  sheet with the actual card attached. Where that's unsupported (most
  desktop browsers today), it falls back to downloading both PNGs — for
  LinkedIn that also opens the old text/link compose window, for
  Instagram/TikTok there's nothing left to open, just a prompt to share the
  downloaded images from the app itself. Once a card is generated, hit
  **"Open a new pack"** to scout another profile, or **"Download card.svg"**
  to keep the result.

## Flag and company, no auto-extracted photo or logo

The card shows a real country flag and current employer name, both
extracted straight from the profile — no manual input. The flag comes from
guessing a country out of the profile's free-text location line
([src/country.ts](src/country.ts)): a known country name, a capital city
("Madrid y alrededores" → Spain), a handful of major non-capital hubs
("San Francisco Bay Area" → US), or a trailing US state abbreviation, in that
order — falling back to no flag rather than guessing wrong. Flags are
bundled locally ([web/public/flags](web/public/flags), from the
[flag-icons](https://github.com/lipis/flag-icons) project) and served from
this site itself — never a third-party request.

There's deliberately no company logo — the only way to get a real one would
be guessing a company's domain and fetching it from a third-party logo API,
leaking the company name over the network, which conflicts with "nothing
ever leaves your browser."

Neither the data export nor the "Save to PDF" export contains a photo
either, so the web app lets you optionally drop one in after the card is
generated — processed and embedded locally like everything else, never
uploaded anywhere. It swaps out the initials-avatar placeholder wherever
that appears (the FUT shield's circle, the TCG art panel, the baseball
card's full photo panel) across all three styles and whichever style you
switch to afterward. Skip it and the initials avatar stays.

The card back links to the profile's own `linkedin.com/in/...` URL when the
PDF export includes one — a plain link rather than a QR code, to avoid a
QR-encoding dependency for a nice-to-have.

## CLI (generates a card you commit to this repo)

**Full export:**

1. **Settings & Privacy → Data Privacy → Get a copy of your data**. Request
   at least: Profile, Positions, Skills, Connections, Recommendations,
   Endorsements, Shares, Comments.
2. Run the generator against the downloaded `.zip` — nothing is uploaded
   anywhere, it all runs on your machine:

   ```bash
   npm install
   npm run generate -- --export ~/Downloads/Complete_LinkedInDataExport.zip --out card.svg
   ```

**Scout mode:**

1. On any profile page → **"More" → "Save to PDF"**.
2. Run the generator against the downloaded `.pdf`:

   ```bash
   npm install
   npm run generate -- --pdf ~/Downloads/Profile.pdf --out card.svg
   ```

Country/flag is auto-detected from the profile's location — add `--country US`
to either command to override the guess. Add `--style tcg` or `--style
baseball` for one of the other two layouts instead of the default FIFA/FUT
shield.

Either way:

3. Commit and push `card.svg` (and only that file — see **Privacy** below).
4. Embed it anywhere:

   ```md
   ![My ScoutCard](https://raw.githubusercontent.com/<you>/<repo>/main/card.svg)
   ```

### Try it without your own data

A fake sample export is included so you can see the pipeline work end to end:

```bash
npm install
npm run build:sample     # writes sample/sample-export.zip (fake data)
npm run generate:sample  # writes sample/sample-card.svg
```

## Scoring

**Full export** ([src/scoring.ts](src/scoring.ts)):

| Stat | Scouted from |
|:--:|:--|
| **PAC** | Posts + comments in the last 12 months |
| **SHO** | Endorsements + recommendations received |
| **PAS** | Connections + recommendations given |
| **DRI** | Skill diversity |
| **DEF** | Recommendations + endorsements given (helping others) |
| **PHY** | Years of experience |

**Scout / PDF** ([src/pdf/scoringPdf.ts](src/pdf/scoringPdf.ts)) — no social-proof data available, so different signals entirely:

| Stat | Scouted from |
|:--:|:--|
| **PAC** | Number of roles held (career pace) |
| **SHO** | Certifications earned |
| **PAS** | Languages spoken |
| **DRI** | Top skills listed (LinkedIn's PDF caps this at 3) |
| **DEF** | Education entries |
| **PHY** | Career span (years since earliest role) |

Raw stats cap at 88, same "legacy gate" idea as GitFut — one good year
shouldn't crown you an Icon. **These formulas are initial guesses, not
calibrated against a real distribution of profiles** — expect numbers to feel
off until they're tuned against more real exports. The Scout formula is a
rougher guess than the full-export one — its input ranges are much smaller
(e.g. 0–5 certifications vs. 0–500 endorsements), so there's less intuition
for what "normal" looks like.

The PDF parser recognizes English, Spanish, French, German, and Portuguese
section headers (LinkedIn renders "Save to PDF" in whatever language the
*viewer's* UI is set to, not the profile owner's) — other languages degrade
gracefully to a 0 for that section rather than crashing.

Each card shows a **scoring version** ("Scoring v1") on the back — bumped
whenever a formula changes, so a card shared under an older formula stays
self-explanatory instead of silently meaning something different.

### Position and archetype

Every card also gets a **position** and **archetype** label (e.g. `ST` /
"Poacher") — the same idea as GitFut's "shooting spike scouts a poacher"
logic: whichever of the six stats scores highest picks both, via one shared
mapping ([src/scoring.ts](src/scoring.ts)) used by both the full-export and
Scout/PDF formulas:

| Top stat | Position | Archetype |
|:--:|:--:|:--|
| PAC | RW | Sprinter |
| SHO | ST | Poacher |
| PAS | CAM | Playmaker |
| DRI | CM | Generalist |
| DEF | CB | Anchor |
| PHY | CDM | Veteran |

## Privacy

A full data export contains other people's data too (connections' names,
companies, who endorsed you). This repo's `.gitignore` blocks committing any
`.zip`/`.pdf` export or a `/private/` folder — only the generated card (which
shows just aggregated stats) is meant to be committed and public.

## Local development

```bash
npm install
npm run dev:web    # http://localhost:5173, hot reload
npm run build:web  # production build to web/dist, what CI deploys
```

`web/dist` is what [.github/workflows/deploy-pages.yml](.github/workflows/deploy-pages.yml)
builds and publishes to GitHub Pages on every push to `main`.
