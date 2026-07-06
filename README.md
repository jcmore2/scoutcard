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
source, different tradeoffs. Both are available in the CLI and the web app.

| | **Full export** (`.zip`) | **Scout** (`.pdf`) |
|---|---|---|
| Source | LinkedIn's official data export | "Save to PDF" button on a profile page |
| Whose profile? | **Only your own** (it's your account's data) | **Anyone's public profile** you can view |
| Signals | Connections, endorsements, recommendations, posting activity, full skill list, tenure | Career history/tenure, top 3 skills, certifications, languages, education — no social-proof metrics |
| Card badge | `FULL EXPORT` | `PDF SCOUT` |

The PDF mode is the one that's actually comparable to GitFut's "look up
anyone" experience — LinkedIn has no public API for that, but "Save to PDF"
is a real, always-available profile-page feature, not scraping. It just has
much thinner signals, so it uses a **separate scoring formula** ([src/pdf/scoringPdf.ts](src/pdf/scoringPdf.ts))
rather than forcing PDF data into the full-export formula.

**Use this respectfully** — being able to view someone's public profile
doesn't mean turning it into a stat card is something they'd expect or want.
Prefer scouting your own profile, or get a person's OK before generating a
card of theirs.

## Web app (no install required)

**[jcmore2.github.io/scoutcard](https://jcmore2.github.io/scoutcard/)**
— pick a mode, drop a file, get your card instantly. It's a static page
(built by GitHub Actions, hosted on GitHub Pages) that parses everything
client-side with JavaScript — nothing is ever uploaded anywhere, not even to
this project. Close the tab and the data is gone. Once a card is generated,
the upload screen tucks itself away behind the result — hit **"Open a new
pack"** to scout another profile. Click "Download card.svg" to save the
result and embed/commit it yourself.

Tap the card to flip it and see what each stat is measuring and what the
tier bands mean. This is a web-app-only feature — the embeddable `card.svg`
file (front side only) is a static image, so it can't be interactive inside
a GitHub README `<img>`.

There's also a **card style switcher**: the same scored data can render as a
FIFA/FUT-style shield card, or as a trading-card-game-style layout
([src/renderCardTcg.ts](src/renderCardTcg.ts)) where each stat reads as an
"attack" with its own effect text. Switching styles re-renders instantly
from the already-computed data — no re-upload needed. Both are original
layouts inspired by those card formats, not any officially licensed card
set, and say so on the card itself.

## Flag and company, but no photo or logo

The card shows a real country flag (if you enter a country code) and your
current employer's name, extracted from whichever source you used. Flags are
bundled locally ([web/public/flags](web/public/flags), from the
[flag-icons](https://github.com/lipis/flag-icons) project) and fetched from
this site itself — never a third-party request.

There's deliberately no profile photo or company logo. Neither the data
export nor the "Save to PDF" export contains an image (verified directly —
scanning a real "Save to PDF" file's embedded objects turns up zero images),
and the only way to get a real logo would be guessing a company's domain and
fetching it from a third-party logo API, which would leak the company name
over the network — a real conflict with "nothing ever leaves your browser."
The initials avatar placeholder stays as-is.

## CLI (generates a card you commit to this repo)

**Full export:**

1. **Settings & Privacy → Data Privacy → Get a copy of your data**. Request
   at least: Profile, Positions, Skills, Connections, Recommendations,
   Endorsements, Shares, Comments.
2. Run the generator against the downloaded `.zip` — nothing is uploaded
   anywhere, it all runs on your machine:

   ```bash
   npm install
   npm run generate -- --export ~/Downloads/Complete_LinkedInDataExport.zip --country US --out card.svg
   ```

**Scout mode:**

1. On any profile page → **"More" → "Save to PDF"**.
2. Run the generator against the downloaded `.pdf`:

   ```bash
   npm install
   npm run generate -- --pdf ~/Downloads/Profile.pdf --country US --out card.svg
   ```

Add `--style tcg` to either command for the trading-card-style layout instead
of the default FIFA/FUT shield.

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

The PDF parser recognizes English and Spanish section headers only (LinkedIn
renders "Save to PDF" in whatever language the *viewer's* UI is set to, not
the profile owner's) — other languages degrade gracefully to a 0 for that
section rather than crashing.

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
