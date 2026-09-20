# Official submission form copy

## Team name

HTTP 404

## Project name

GridPoint — Network Design Lab

## One-line summary

An explainable warehouse-network optimizer that places hubs, assigns demand, stress-tests peak scenarios, and makes delivery-versus-infrastructure trade-offs visible.

## Problem

Companies need to place one or more warehouses across a city while minimizing demand-weighted delivery cost. Neighborhoods with more orders should influence the solution more strongly, while operational constraints such as capacity and maximum delivery radius must remain visible.

## Solution

HTTP 404 provides an interactive decision cockpit for entering, uploading, or loading neighborhood demand. It uses weighted k-means or deterministic existing-site placement to propose hub locations, assigns every neighborhood to a hub, and reports delivery cost, fixed infrastructure cost, weighted average leg, savings versus a single hub, service level, radius exceptions, and hub utilization. Judges can drag hubs to run immediate sensitivity analysis, compare +15% and +30% demand scenarios, inspect assignments, and export the recommendation.

## Innovation

The differentiator is the combination of explainable optimization and decision-quality interaction. Instead of returning one static cluster output, the product exposes the trade-offs that a logistics manager actually needs to review: manual hub sensitivity, radius violations, capacity, vehicle mix, cost curves, readiness scoring, and saved scenario continuity.

## Technical implementation

React 19 and TypeScript power the dashboard. The client contains a deterministic weighted facility-location model and SVG planning map. The managed fullstack layer adds Express, tRPC, Manus OAuth, Drizzle ORM, MySQL/TiDB, and owner-scoped scenario persistence. Vitest covers authentication, saved-scenario authorization/validation paths, and the client model’s cost, determinism, guardrail, surge, and parser behavior.

## AI disclosure

AI coding assistants were used for code generation, refactoring, test writing, debugging, and documentation. The HTTP 404 team selected the challenge, product direction, model assumptions, interaction design, and validation criteria. Open-source libraries and the managed starter template are disclosed in the repository README.

## Demo link

https://gridoptlab-ufj3xmps.manus.space

## Repository

https://github.com/jhaaryan7580-dev/http404-gridpoint

## Demo video

https://github.com/jhaaryan7580-dev/http404-gridpoint/releases/tag/demo-video-v1.0

The release contains the official `HTTP404-GridPoint-demo.mov` video asset. It is published as a GitHub Release asset because the video is larger than GitHub's 100 MB regular repository-file limit.
