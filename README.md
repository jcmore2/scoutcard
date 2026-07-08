# ScoutCard

Turn your work history into a collectible stat card — an MVP exploring
whether this can be done using **only GitHub as infrastructure** (no server,
no database, no hosting bill).

This is a companion experiment to [GitFut](https://github.com/Younesfdj/gitfut),
which does the same thing for GitHub profiles. GitHub has a free public API
GitFut can query live; LinkedIn does not expose one for arbitrary profiles, so
this project works from **your own official data export**, or **any public
profile's "Save to PDF" export**, instead of scraping.

## Why "just GitHub" infra

GitFut runs on Vercel + a self-hosted Redis instance to serve a dynamic
`username.png` on demand. GitHub alone (Actions + a repo + raw file serving)
can't do on-demand dynamic rendering for arbitrary input — there's no
always-on server. What it *can* do is: you generate a static SVG file
locally, commit it, and it's instantly servable at a permanent URL:

```
https://raw.githubusercontent.com/<you>/<repo>/main/<path-to-card>.svg
```

"Self-updating" here means "re-run the generator and push" rather than
"recomputed live per visitor." No Vercel, no Redis, no cost.

## Two ways to scout a profile

There are two independent input modes — same card format, different data
source, different tradeoffs.

| | **Full export** (`.zip`) | **Scout** (`.pdf`) |
|---|---|---|
| Source | LinkedIn's official data export | "Save to PDF" button on a profile page |
| Whose profile? | **Only your own** (it's your account's data) | **Anyone's public profile** you can view |
| Signals | Connections, endorsements, recommendations, posting activity, full skill list, tenure | Career history/tenure, top 3 skills, certifications, languages, education — no social-proof metrics |
| Card badge | `FULL EXPORT` | `PDF SCOUT` |
| Available in | CLI only | CLI and the web app |

The PDF/Scout mode is the one that's actually comparable to GitFut's "look up
anyone" experience — LinkedIn has no public API for that, but "Save to PDF"
is a real, always-available profile-page feature, not scraping. It just has
much thinner signals, so it uses a **separate scoring formula** ([src/pdf/scoringPdf.ts](src/pdf/scoringPdf.ts))
rather than forcing PDF data into the full-export formula. It's also the
only mode the web app offers — the full-export flow needs your own account
data, which doesn't add much for a public drop-a-file-and-go tool, so it's
CLI-only to keep the web experience to one clear path.

**Use this respectfully** — being able to view someone's public profile
doesn't mean turning it into a stat card is something they'd expect or want.
Prefer scouting your own profile, or get a person's OK before generating a
card of theirs.

## Web app (no install required)

**[jcmore2.github.io/scoutcard](https://jcmore2.github.io/scoutcard/)**
— drop a "Save to PDF" export, get your card instantly. It's a static page
(built by GitHub Actions, hosted on GitHub Pages) that parses everything
client-side with JavaScript — nothing is ever uploaded anywhere, not even to
this project. Close the tab and the data is gone. Once a card is generated,
the upload screen tucks itself away behind the result — hit **"Open a new
pack"** to scout another profile. Click "Download card.svg" to save the
result and embed/commit it yourself.

Tap the card to flip it and see what each stat is measuring and what the
tier bands mean. The back matches whichever front style is active — same
shield silhouette and gradient for FIFA/FUT, same gold border and parchment
for the trading-card style ([web/cardBack.ts](web/cardBack.ts) reuses the
exact shape/palette constants the fronts export, via an SVG `foreignObject`
so the stat list can still be laid out with regular HTML/CSS). This is a
web-app-only feature — the embeddable `card.svg` file (front side only) is a
static image, so it can't be interactive inside a GitHub README `<img>`.

There's also a **card style switcher** with three options — the same scored
data re-renders instantly, no re-upload needed:

- **FIFA/FUT** ([src/renderCard.ts](src/renderCard.ts)) — shield silhouette, all 6 stats on the front.
- **Trading-card-game** ([src/renderCardTcg.ts](src/renderCardTcg.ts)) — each stat reads as an "attack" with its own energy-type color.
- **Baseball** ([src/renderBaseball.ts](src/renderBaseball.ts)) — a classic sports-card layout: the front is just identity (photo, name, team, one headline stat), the full 6-stat breakdown lives on the back, the way real player cards split the two.

All three are original layouts inspired by those card formats, not any
officially licensed card set, and say so on the card itself. Numbers count
up from 0 when a card first appears or you switch styles — the SVG you
download always shows the real value immediately, the count-up is a
browser-only touch.

A few smaller touches round out the web app: a spinner while the PDF is
being parsed, a clearer error box (with an icon and a concrete next step) if
the file isn't a valid "Save to PDF" export, an icon-based walkthrough of
where "Save to PDF" actually lives on a profile page, and share buttons for
X/LinkedIn (these link to the site itself, not a specific card — see
**Limitations** below for why there's no per-card shareable URL).

## Flag and company, but no photo or logo

The card shows a real country flag and the current employer's name, both
extracted straight from the profile — no manual input. The flag comes from
guessing a country out of the profile's free-text location line
([src/country.ts](src/country.ts)): a known country name, a capital city
("Madrid y alrededores" → Spain, since Madrid is its capital), a handful of
major non-capital hubs ("San Francisco Bay Area" → US), or a trailing US
state abbreviation, in that order — falling back to no flag rather than
guessing wrong. Flags themselves are bundled locally ([web/public/flags](web/public/flags),
from the [flag-icons](https://github.com/lipis/flag-icons) project) and
fetched from this site itself — never a third-party request.

There's deliberately no profile photo or company logo. Neither the data
export nor the "Save to PDF" export contains an image (verified directly —
scanning a real "Save to PDF" file's embedded objects turns up zero images),
and the only way to get a real logo would be guessing a company's domain and
fetching it from a third-party logo API, which would leak the company name
over the network — a real conflict with "nothing ever leaves your browser."
The initials avatar placeholder stays as-is.

The card back also links to the profile's own `linkedin.com/in/...` URL when
the PDF export includes one (under its Contact section) — a plain link
rather than a QR code, to avoid pulling in a QR-encoding dependency for a
nice-to-have.

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

## Try it without your own data

A fake sample export is included so you can see the pipeline work end to end:

```bash
npm install
npm run build:sample     # writes sample/sample-export.zip (fake data)
npm run generate:sample  # writes sample/sample-card.svg
```

## Stat mapping

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

Each card also shows a **scoring version** ("Scoring v1") on the back —
bumped whenever a formula changes, so a card shared under an older formula
stays self-explanatory instead of silently meaning something different.

## Privacy

A full data export contains other people's data too (connections' names,
companies, who endorsed you). This repo's `.gitignore` blocks committing any
`.zip`/`.pdf` export or a `/private/` folder — only the generated card (which
shows just aggregated stats) is meant to be committed and public.

## Limitations of the "just GitHub" approach

- No arbitrary-username lookup like `gitfut.com/<anyone>` — this only ever
  works from a data export the profile owner uploads themselves, since
  LinkedIn has no public API for looking up other people's profiles.
- The web app renders the card live per visit, but nothing is stored —
  there's no shareable `scoutcard.../jcmore2` URL. Persisting a card at a
  permanent URL still means downloading it and committing it yourself (the
  CLI path above), since there's no backend to save it for you.
- Scoring constants are unvalidated placeholders (see above).

## Local development

```bash
npm install
npm run dev:web    # http://localhost:5173, hot reload
npm run build:web  # production build to web/dist, what CI deploys
```
