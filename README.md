# linkedinfut

Turn your LinkedIn profile into a FIFA/FUT-style player card — an MVP exploring
whether this can be done using **only GitHub as infrastructure** (no server,
no database, no hosting bill).

This is a companion experiment to [GitFut](https://github.com/Younesfdj/gitfut),
which does the same thing for GitHub profiles. GitHub has a free public API
GitFut can query live; LinkedIn does not expose one for arbitrary profiles, so
this project works from **your own official data export** instead of scraping.

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

## How it works

1. Export your own data from LinkedIn: **Settings & Privacy → Data Privacy →
   Get a copy of your data**. Request at least: Profile, Positions, Skills,
   Connections, Recommendations, Endorsements, Shares, Comments.
2. Run the generator against the downloaded `.zip` — nothing is uploaded
   anywhere, it all runs on your machine:

   ```bash
   npm install
   npm run generate -- --export ~/Downloads/Complete_LinkedInDataExport.zip --country US --out card.svg
   ```
3. Commit and push `card.svg` (and only that file — see **Privacy** below).
4. Embed it anywhere:

   ```md
   ![My LinkedInFut card](https://raw.githubusercontent.com/<you>/<repo>/main/card.svg)
   ```

## Try it without your own data

A fake sample export is included so you can see the pipeline work end to end:

```bash
npm install
npm run build:sample     # writes sample/sample-export.zip (fake data)
npm run generate:sample  # writes sample/sample-card.svg
```

## Stat mapping

| Stat | Scouted from |
|:--:|:--|
| **PAC** | Posts + comments in the last 12 months |
| **SHO** | Endorsements + recommendations received |
| **PAS** | Connections + recommendations given |
| **DRI** | Skill diversity |
| **DEF** | Recommendations + endorsements given (helping others) |
| **PHY** | Years of experience |

Raw stats cap at 88, same "legacy gate" idea as GitFut — one good year
shouldn't crown you an Icon. **These formulas are initial guesses, not
calibrated against a real distribution of profiles** — expect numbers to feel
off until they're tuned against more real exports.

## Privacy

Your LinkedIn export contains other people's data too (connections' names,
companies, who endorsed you). This repo's `.gitignore` blocks committing any
`.zip` export or a `/private/` folder — only the generated card (which shows
just your own aggregated stats) is meant to be committed and public.

## Limitations of the "just GitHub" approach

- No live per-visitor rendering — updating your card is a manual
  re-export + re-run + push, not automatic.
- No arbitrary-username lookup like `gitfut.com/<anyone>` — this only ever
  works from a data export the profile owner has themselves.
- Scoring constants are unvalidated placeholders (see above).
