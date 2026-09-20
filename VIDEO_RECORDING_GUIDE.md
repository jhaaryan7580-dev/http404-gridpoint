# HTTP 404 — Linear Demo Video and Submission Guide

## What to record

Record a **screen capture with voiceover** of the live HTTP 404 / GridPoint website. This version is deliberately organized as one continuous tour: start at the top of the page, move down the control rail, then move down the main workspace and finish with exports. You will not jump between unrelated controls.

A full tour takes approximately **5–6 minutes**. If the hackathon requires a strict 2–3 minute video, use the short-cut instructions near the end while keeping the same order. Loom, OBS Studio, QuickTime, Clipchamp, or a built-in screen recorder are all suitable. Use 1080p if available, keep the cursor visible, and enable the microphone.

## Before recording

1. Open the live website and refresh it.
2. Start on the **Bengaluru** dataset.
3. Use 90–100% browser zoom so the controls and metrics remain readable.
4. Close unrelated tabs, notifications, and private information.
5. Create a folder named `HTTP404-submission` for the MP4 and downloaded evidence files.
6. Do not spend time signing in unless the hackathon specifically requires a login demonstration. The core analysis works without login.

## Complete voiceover script

Read this naturally while performing the matching action. Each numbered item is one continuous step in the recording.

### 1. Opening and dashboard orientation

**Action:** Start at the top of the page. Keep the HTTP 404 brand, title, top metrics, and map header visible. Move the cursor slowly across the interface without clicking.

**Say:**

> “Hello, we are HTTP 404, and this is GridPoint — Network Design Lab, our warehouse-location optimization platform. Warehouse placement is a network decision, not just a map pin. High-demand neighborhoods should pull hubs closer, but every additional hub adds fixed infrastructure cost. GridPoint makes that trade-off visible, explainable, and easy to test.”

### 2. Appearance and account controls

**Action:** At the top-right, click the light/dark mode button once, pause, and click it back. If time permits, open Appearance settings and show the accent options without changing them. Point to the sign-in or workspace button, but do not begin login unless required.

**Say:**

> “The cockpit supports light and dark modes, accent preferences, command search, and a private workspace for signed-in scenario continuity. These features make the tool usable in a real review, while the core analysis is available immediately without requiring an account.”

### 3. Demand controls and presets

**Action:** Stay at the top of the left control rail. Point to the node count and orders per day. Click **Load Mumbai**, wait for the map and metrics to update, click **Load Delhi**, wait again, and finally click **Load Bengaluru** to restore the clean demo state.

**Say:**

> “We begin with the Bengaluru baseline. The demand rail shows how many neighborhoods and daily orders are being modeled. The preset controls let us switch to realistic Mumbai or Delhi networks, and the same dashboard recalculates for each geography.”

### 4. Uploading and editing demand

**Action:** Point to **Upload demand file** and show the accepted CSV, TSV, TXT, JSON, and PDF formats. Do not open a private file during the final recording. Then click one demand-table name or numeric field, type a harmless edit, click outside to commit it, and point to **Add demand node**. Reload Bengaluru immediately afterward if you changed the data and want a clean result.

**Say:**

> “The model is not limited to presets. A planner can upload multiple common demand-file formats. The table is editable in place: names, latitude, longitude, and daily orders can be corrected, and demand nodes can be added or removed before recalculating.”

### 5. Warehouse count and placement logic

**Action:** In the Network section, move **Number of warehouses** from 3 to 2 and back to 3. Open the placement dropdown and show **weighted k-means** and **existing-site snap-to-site placement**, then leave it on weighted k-means.

**Say:**

> “Next, the planner chooses the network shape. The warehouse slider scales with the number of loaded demand nodes. GridPoint offers a weighted centroid placement mode and a deterministic existing-site mode, so the team can compare an optimal-point layout with a placement constrained to real demand locations.”

### 6. Economics and vehicle mix

**Action:** Scroll down within the left control rail until Cost model is visible. Point to delivery cost per kilometer and fixed cost per hub. Toggle **Use vehicle mix** on and pause so the result can be seen.

**Say:**

> “The economics are explicit. Variable delivery cost depends on distance, daily orders, and the configured rate, while infrastructure cost is a fixed amount per active hub. The optional vehicle mix selects bike, van, or truck rates based on each delivery leg.”

### 7. Capacity and service radius

**Action:** In Guardrails, toggle **Warehouse capacity** on and point to the maximum orders-per-hub field. If an overload alert appears, show it briefly, then toggle capacity back off. Turn **Service radius analysis** on, move the slider from 8 to 7 kilometers, pause on the violation count, and return it to 8 kilometers.

**Say:**

> “Operational constraints are modeled as visible guardrails. Capacity can expose overloaded hubs, while service-radius analysis highlights demand nodes outside the operating threshold and updates the service-level percentage and violation count.”

### 8. Demand stress scenarios

**Action:** In the Scenario section, click **Base**, then **+15%**, then **+30%**, waiting briefly after each click. Leave the app on **+15%** for the results demonstration.

**Say:**

> “The stress-test controls raise demand without changing geography. Base, plus-fifteen-percent, and plus-thirty-percent scenarios show whether the recommended network remains practical as orders increase.”

### 9. Workspace and map layers

**Action:** Continue downward until Workspace is visible. Point to the sign-in/library control. On the map, toggle **Zones** off and on, then **Routes** off and on. Leave both layers on.

**Say:**

> “The workspace can save private scenarios for signed-in team members. On the map, Routes and Zones are optional layers: routes show individual assignments, while zones make the coverage pattern around each hub easier to read.”

### 10. Drag-and-recalculate sensitivity analysis

**Action:** Move to the map and drag H1 a short distance. Pause while **Recalculating** appears. Point to changed route colors, assignments, and top metrics, then release the hub.

**Say:**

> “This is the signature interaction. I can drag any proposed hub and immediately test a different layout. HTTP 404 recalculates assignments, delivery cost, weighted average leg, savings, service level, and exceptions in the browser. The recommendation also records that this is a manual sensitivity layout.”

### 11. Metrics, alerts, and decision brief

**Action:** Scroll the main workspace downward to the metrics and readiness strip. Point to the information icons beside Total Cost, Modeled Impact, Weighted Average Leg, and Service Level. Show any radius or capacity alert. Continue down to the Decision Brief and Cost Breakdown cards.

**Say:**

> “The metric tooltips explain the model in plain language. The readiness strip calls out service exceptions and the highest-exposure node. The Decision Brief separates delivery cost from infrastructure cost so a lower last-mile cost is not confused with a lower total investment.”

### 12. Results tabs in visible order

**Action:** Click the tabs from left to right: **Decision brief**, **Assignments**, **Hub loads**, and **Cost curve**. In Assignments, show hub badges, orders, legs, vehicles, delivery costs, and status. In Hub loads, show demand load and utilization. In Cost curve, show delivery, infrastructure, and total cost lines plus the scope note.

**Say:**

> “The results are organized as a decision brief, an assignment audit, a hub-load view, and a cost curve. The audit explains every node, the hub view exposes utilization and capacity risk, and the curve shows why adding hubs reduces delivery cost but increases fixed infrastructure cost.”

### 13. Exports and printable report

**Action:** Continue to the Exports section. Click **Download Assignments CSV**, then **Download Cost Summary CSV**. Finally click **Generate Decision Report**. Show the report tab briefly. Use Print and Save as PDF if needed, then return to the app.

**Say:**

> “The result is ready for handoff. The Assignments CSV provides the operational audit, the Cost Summary CSV provides the headline economics and service metrics, and the Decision Report creates a clean printable summary for review.”

### 14. Closing

**Action:** Return to the top or leave the Decision Brief visible with the final metrics. Keep the HTTP 404 branding visible for the last few seconds.

**Say:**

> “HTTP 404 turns raw neighborhood demand into a transparent, testable, and defensible warehouse decision. Thank you.”

## Strict 2–3 minute version

If the submission form has a hard time limit, keep the same order but shorten these steps:

- Show light/dark mode only; do not open Appearance settings.
- Show Mumbai, then return to Bengaluru; mention Delhi and file uploads without opening them.
- Mention editing, adding nodes, vehicle mix, capacity, and workspace in one sentence instead of demonstrating each.
- Demonstrate the map drag, +15% scenario, one result tab, and at least one export in full.

The priority order is: **opening → Bengaluru metrics → one preset → controls summary → map drag → +15% comparison → Assignments tab → exports → close**.

## Exact click order

1. Light/dark mode, then restore the original mode.
2. Load Mumbai.
3. Load Delhi.
4. Load Bengaluru.
5. Show Upload demand file.
6. Edit one demand-table value and show Add demand node.
7. Change warehouse count from 3 to 2 and back to 3.
8. Show both placement options and leave weighted k-means selected.
9. Show delivery/fixed cost and toggle vehicle mix.
10. Show capacity, then service radius, and return radius to 8 km.
11. Click Base, +15%, and +30%; leave +15% selected.
12. Toggle Zones and Routes off and on.
13. Drag H1 and show Recalculating.
14. Show metric tooltips, alerts, and Decision Brief.
15. Open Decision brief, Assignments, Hub loads, and Cost curve in order.
16. Download Assignments CSV.
17. Download Cost Summary CSV.
18. Generate Decision Report and optionally save it as PDF.

## Files to download from the app

- **Assignments CSV:** detailed neighborhood audit including coordinates, orders, assigned hub, distance, vehicle, rate, delivery cost, and service status.
- **Cost Summary CSV:** dataset, scenario, hub count, total cost, delivery cost, fixed cost, baseline, savings, weighted leg, radius, violations, and service level.
- **Decision Report:** printable HTML report that can be saved through the browser’s **Print → Save as PDF** option.

Keep these in the `HTTP404-submission` folder as supporting evidence. They are not normally the video itself.

## What to upload to the hackathon website

1. **Demo video:** upload the final MP4 or paste a viewable Loom, Drive, or YouTube link.
2. **Live demo URL:** use the deployed HTTP 404 website link from the README.
3. **GitHub repository:** `https://github.com/jhaaryan7580-dev/http404-gridpoint`
4. **Project description:** copy `SUBMISSION_FORM_COPY.md`.
5. **Optional supporting files:** attach the Decision Report PDF, Assignments CSV, or Cost Summary CSV only if the form has an optional attachment field.

Do not upload `.env` files, browser cookies, private scenario data, `node_modules`, or the entire source folder as a video attachment.

## Video export settings

Use MP4/H.264, 1080p, 30 frames per second, with clear microphone audio. Name the file:

```text
HTTP404-GridPoint-demo.mp4
```

## Final checklist

- [ ] The video follows one continuous top-to-bottom order.
- [ ] The introduction names HTTP 404 and GridPoint.
- [ ] Bengaluru, Mumbai, and Delhi presets are shown or mentioned.
- [ ] Uploading and editable demand controls are shown or mentioned.
- [ ] Warehouse count and placement options are shown.
- [ ] Cost controls and vehicle mix are shown.
- [ ] Capacity and service radius are shown.
- [ ] Base, +15%, and +30% scenarios are shown.
- [ ] Routes and Zones layers are shown.
- [ ] A hub is dragged and Recalculating is visible.
- [ ] Metrics, tooltips, alerts, and Decision Brief are shown.
- [ ] Assignments, Hub loads, and Cost curve tabs are shown.
- [ ] At least one CSV and the Decision Report are generated.
- [ ] The final MP4 is viewable and the link permissions allow judges to watch it.
- [ ] The live website opens in an incognito window.
- [ ] The GitHub repository is public and CI is green.
- [ ] The submission uses team name **HTTP 404** and project name **GridPoint — Network Design Lab**.

## If you make a mistake

Pause, repeat the sentence, and continue. Do not restart the whole recording for a small mistake. If necessary, trim the pause in Loom, Clipchamp, QuickTime, OBS, or a phone editor. Clear narration and a complete product flow matter more than cinematic editing.
