# WoW Forever Class Designer

A public Classic-style calculator for twelve classes, including custom Death Knight, Demon Hunter and Scarlet-inspired Monk designs. Three trees per class, prerequisite arrows, ranked descriptions, spellbooks, device-local builds and shareable build links. **Design mode** opens a full editor with browser-local drafts, ability templates and the complete icon library. No login required.

## Publish when ready

1. In this repository, open **Settings → Pages** and select **GitHub Actions** as the source.
2. Open **Actions → Publish calculator to GitHub Pages → Run workflow** and choose `main`.
3. The successful workflow shows the published URL. The expected address is `https://rathmourne.github.io/WoWForeverClassDesigner/`.

Updates run validation automatically. They do **not** publish automatically; run the publishing workflow when the design is ready.

## Keep control of your designs

The main page is the calculator. Click **Design mode** to open `designer.html`. Anyone can create or rewrite a copy of a class there. Changes are saved in that person's browser and can be exported or shared; they do not change the calculator's published defaults or anyone else's drafts. GitHub repository write access controls who can publish updates.

Switching between Calculator and Design carries the entire selected class, including all talent definitions, abilities and allocated points. Returning to Calculator previews your current edits. A previously saved version of the selected class is backed up before replacement; **Export previous class** retrieves it without resetting any other classes. When a newly published class has a newer design version, the editor updates that class and retains its prior copy as a backup.

Class definitions and images are public once deployed. This static website does not provide authenticated private data storage or a shared editing service. Drafts use separate local storage from point builds. There is no server upload, tracking code or remote font request; outbound reference links open only when clicked. Clearing site data removes local drafts, so export a backup.

## Update class definitions

1. Use **Export project** in the local studio or hosted **Design mode**.
2. Replace this repository's `project.json` with that JSON export.
3. Copy any newly referenced local image files from the studio's `dist/assets/` into the matching `assets/` path here. Uploaded images embedded in the export need no separate file.
4. Build and test, commit and push. Run the publishing workflow when ready.

The initial definitions are from the latest saved project backup, including the nine Forever classes and three custom classes. Publishing clears allocated points from the definitions; visitors each start with their own build. New published class definitions change the calculator's build version, so old rank links are not silently applied to changed trees. Designer share links include the selected class definitions and open a calculator view of that snapshot.

Commit authorship uses a GitHub noreply address, and sanitized commit timestamps use UTC. Only project files and game assets are included; machine paths, chat transcripts, credentials, editor session captures and private research files stay outside the repository.

## Sharing without overwriting another person's creations

Click **Share design** in the designer. The link includes a snapshot of the selected class's definitions and abilities and opens a calculator preview. **Include current talent points** optionally adds the author's allocation. Each shared preview uses separate browser storage from the recipient's designer drafts and normal builds. Viewing or changing a shared preview never imports it over the recipient's existing creation. **Import** remains an explicit action in the designer.

When the selected design matches the published class, sharing uses a compact build link containing only its version, class and point allocations. Unpublished rewrites use a gzip-compressed snapshot. Images already hosted by the site are referenced by path, and repeated custom images are included only once. The full JSON export also reuses hosted images without modifying the saved browser draft. Local studio share links point to the hosted calculator so friends can open them directly. Unknown uploaded images remain embedded; image-heavy custom designs may still require a standalone file.

## Spell damage modifiers

Every ability and talent has an editable **Spell damage modifiers** field. Ability details display the modifier text and imported effect rows. Database templates copy these values independently so you can rewrite them.

The initial detailed import checked 3,027 spell references: 1,987 Forever and 1,040 Retail references for the three custom classes. The ForeverDB client dataset (build **1.60.1.70338**) contains all 1,987 matching Forever spell records, including per-effect Spell Power and Attack Power coefficients, base values, level growth and tick intervals. The modifier source and build are shown in ability details. Where the client stores no coefficient, that is explicitly stated; a server-controlled effect is not assigned an invented value.

Retail references for Death Knight, Demon Hunter and Monk remain separate. Explicit scaling terms in their existing Wowhead tooltips are copied as tooltip terms, with their original reference edition. Missing Retail details remain editable and marked as unavailable rather than being filled with Forever values. For example, Forever Lightning Bolt Rank 3 (spell 548) lists a Spell Power coefficient of 0.714 (71.4%). This is source metadata for design work, not a damage simulator.

## Local preview

Node.js 22 or newer is required. No dependency installation is needed.

```sh
npm run build
npm test
python -m http.server 4180 --directory site
```

Open `http://localhost:4180/`. All paths are relative, so the same output works at the GitHub Pages repository subpath. Only `site/` is uploaded by the deployment workflow.

## Reference material

Game icons and original reference spell data come from [Wowhead](https://www.wowhead.com/forever). Current Forever spell effects and coefficients come from [ForeverDB](https://foreverdb.net), which extracts the Forever client data. Custom designs can be rewritten in Design mode. Custom spec background art was generated for this project. Warcraft game material belongs to its respective owners; this is an unofficial fan project.

The Blood, Unholy, Demon Hunter, and Scarlet Monk backgrounds use a Classic-era painted style generated with the built-in image generation tool. Frost retains its original frozen-citadel image. The [prompt set](assets/spec-backgrounds/classic-art-prompts.json) records the eight generated replacements. Artwork loading is versioned without changing project definitions, saved ranks, or uploaded backgrounds.

Bundled custom-spec backgrounds render as 256 × 384 textures for a softer Classic look. This uses a separate background layer; talent icons, rank text, and prerequisite arrows retain their original resolution. Full-size source paintings remain available, and standalone exports embed the same lower-resolution backgrounds.

Workflow setup follows [GitHub's custom Pages workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).
