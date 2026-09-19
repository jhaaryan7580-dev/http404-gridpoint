# HTTP 404 — GridPoint Network Design Lab

[![HTTP 404 CI](https://github.com/jhaaryan7580-dev/http404-gridpoint/actions/workflows/ci.yml/badge.svg)](https://github.com/jhaaryan7580-dev/http404-gridpoint/actions/workflows/ci.yml)
[![Live demo](https://img.shields.io/badge/live%20demo-open-1c9b70)](https://gridoptlab-ufj3xmps.manus.space)
[![License](https://img.shields.io/badge/license-MIT-d95e1d.svg)](./LICENSE)

> **Where should the warehouse go?**
>
> HTTP 404 is a warehouse network planning cockpit that turns neighborhood demand into an explainable, cost-aware delivery network. It helps a decision-maker place hubs, assign demand, stress-test peak demand, inspect service exceptions, and export a board-ready recommendation.

[Open the live website](https://gridoptlab-ufj3xmps.manus.space)

## The challenge

GridPoint addresses the **GRIDPOINT** warehouse-location challenge from Hack-a-Matics. Given neighborhood coordinates and daily orders, the system determines suitable warehouse locations and assignments while minimizing demand-weighted delivery cost. High-order neighborhoods contribute more heavily to the objective than low-volume neighborhoods.

The application covers the required flow:

`Neighborhood data → location visualization → warehouse optimization → assignments → cost comparison`

## Why it matters

Warehouse placement is an infrastructure decision with daily operational consequences. A poor layout creates long last-mile legs, service failures, and unnecessary fixed cost. GridPoint makes the trade-off visible before a team commits: it shows which nodes are exposed, what each hub carries, how much a scenario costs, and how the answer changes under peak demand.

## Product highlights

- **Demand-to-network modeling:** enter demand nodes manually, load Bengaluru/Mumbai/Delhi presets, or upload CSV data with `name`, `lat`, `lon`, and `orders` columns.
- **Weighted optimization:** choose weighted k-means or weighted k-medoids placement and select the warehouse count.
- **Drag-and-recalculate sensitivity analysis:** move any proposed hub on the map and immediately recalculate assignments, total cost, weighted average leg, savings, and service exceptions.
- **Color-coded assignment map:** demand nodes and delivery lines are colored by assigned hub, with optional route and catchment layers.
- **Operational guardrails:** model warehouse capacity, a 3–15 km service radius, vehicle mix, and +15%/+30% demand stress scenarios.
- **Decision economics:** separate variable delivery cost from fixed infrastructure cost, compare scenarios side by side, and inspect the cost curve by hub count.
- **Decision readiness:** a compact readiness score calls out radius exceptions and the highest delivery-exposure node.
- **Exports:** download assignments CSV, download cost summary CSV, or generate a printable decision report.
- **Private workspace:** sign in with managed OAuth to save, restore, and delete owner-scoped scenario snapshots across devices.
- **Power-user UX:** dark/light mode, orange/teal/violet accents, keyboard command search with `Cmd/Ctrl + K`, and a short decision playbook.

## Model

Let `d_i` be daily orders for neighborhood `i`, `x_i` its coordinate, and `h(i)` its assigned hub. The variable delivery objective is:

```text
Delivery cost = Σ distance(x_i, h(i)) × d_i × cost_per_km
Total cost = Delivery cost + fixed_cost_per_hub × number_of_hubs
```

Demand is used as the weight during centroid updates, so high-order neighborhoods pull candidate hubs more strongly. Distances are calculated on a local Euclidean planning grid using latitude/longitude conversion. Capacity and radius guardrails are evaluated after assignment, and infeasible capacity assignments are surfaced rather than silently hidden.

The model is intentionally explainable: every assignment, distance, cost, exception, and scenario comparison is visible in the UI.

### Implementation scope

The current hackathon release intentionally uses a deterministic, demand-weighted clustering heuristic in the client so hub dragging, peak-demand scenarios, and cost-curve comparisons recalculate immediately without a network round trip. This is an interaction and reliability trade-off, not a claim of global optimality. An exact capacitated facility-location MILP with a discrete candidate-hub set is a documented next backend evolution; it would require an asynchronous solver contract and an explicit candidate-set policy, so it is not introduced into the stable submission at the last minute.

## Challenge requirement mapping

| Hackathon requirement | HTTP 404 implementation |
| --- | --- |
| Enter/upload neighborhood data | Editable demand table, Bengaluru/Mumbai/Delhi presets, CSV upload |
| Visualize neighborhood locations | Interactive planning map with demand nodes and proposed hubs |
| Select warehouse count | Warehouse-count slider scaled to loaded demand nodes |
| Optimize locations | Demand-weighted k-means or weighted k-medoids |
| Assign each neighborhood | Nearest feasible hub assignment with colored routes |
| Calculate distance and cost | Total distance, weighted average leg, delivery cost, fixed cost, total cost |
| Compare arrangements | Single-hub baseline, scenario comparison, cost curve, drag sensitivity |
| Capacity and service radius | Capacity guardrail, 3–15 km radius slider, violation highlighting |
| Bonus: demand changes | Base, +15%, and +30% peak-demand scenarios |
| Bonus: vehicle types | Bike, van, truck rate selection |
| Bonus: infrastructure trade-off | Fixed-per-hub cost breakdown and total-cost curve |

## Tech stack

- React 19 + TypeScript
- Vite 7
- Recharts for the cost curve
- SVG planning map for deterministic, dependency-light visualization
- Express + tRPC for the managed fullstack API
- Manus OAuth for authentication
- Drizzle ORM + MySQL/TiDB for private saved scenarios
- Vitest for server regression tests
- GitHub Actions for check, test, build, and lint

## Run locally

Requirements: Node.js 22+, pnpm 10+, and a MySQL/TiDB database if you want cloud accounts and saved scenarios locally.

```bash
pnpm install
cp .env.sample .env
pnpm dev
```

The app is then available at `http://localhost:3000`.

For a production-style build:

```bash
pnpm check
pnpm test
pnpm build
pnpm start
```

Authentication and cloud scenarios require the managed environment variables listed in `.env.sample`. Never commit `.env` files or secret values.

## Test and quality gates

```bash
pnpm check
pnpm test
npx --yes oxlint@1.83.0 client/src --deny-warnings
pnpm build
```

The repository currently includes regression coverage for OAuth logout and protected scenario listing, saving, validation, deletion, and unauthenticated access.

## Two-minute demo flow

1. Start on the Bengaluru baseline and point out the total cost, weighted average leg, service level, and readiness score.
2. Load Mumbai or Delhi to show that the same model handles a different demand geography.
3. Drag a proposed hub and call out the immediate recalculation of assignments and cost.
4. Move the service-radius slider or enable capacity to expose operational exceptions.
5. Run the +15% demand scenario and compare the stress-test table.
6. Open Assignments to show the audit trail, then export the assignment CSV or printable report.
7. Finish by opening the workspace: signed-in users can save the winning scenario for later review.

See [DEMO_SCRIPT.md](./DEMO_SCRIPT.md) for the spoken version.

## Credits and acknowledgements

See [CREDITS.md](./CREDITS.md) for the project credits, AI disclosure, platform attribution, open-source acknowledgements, and data provenance notes.

## AI and starter-template disclosure

AI coding assistants were used during the hackathon for code generation, refactoring, test writing, debugging, and documentation. The team selected the challenge, defined the product direction, chose the weighted facility-location approach and assumptions, reviewed the generated implementation, and validated the behavior with tests and live scenarios. The core modeling logic and integration were not presented as a fake or hardcoded AI component.

The project also uses open-source libraries and the managed Manus WebDev starter template for React, Vite, Express, tRPC, authentication, database wiring, and UI primitives. The template and libraries were extended substantially for the warehouse-optimization challenge; their use is disclosed here in accordance with the hackathon rules.

## Team

**HTTP 404**

The team name is HTTP 404. The product descriptor is GridPoint Network Design Lab.

## License

MIT. See [LICENSE](./LICENSE).
