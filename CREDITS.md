# HTTP 404 — Credits and acknowledgements

This document records the people, platforms, libraries, and data assumptions behind **GridPoint — Network Design Lab**.

## Team

**HTTP 404** is the submitting team. The team owned the challenge selection, product direction, modeling assumptions, interaction design, integration decisions, testing, and final review.

## Challenge

Thanks to the **Hack-a-Matics organizers and mentors** for the warehouse-location optimization brief and judging framework that shaped this project.

## AI assistance

**Manus AI** and AI coding assistants were used during the hackathon for code generation, refactoring, test writing, debugging, documentation, and release preparation. AI assistance supported implementation; the HTTP 404 team made the product decisions, selected the weighted facility-location approach, defined the objective and guardrails, reviewed generated changes, and validated the working result. No fake or hardcoded AI component is claimed as the optimization engine.

## Platform and starter infrastructure

The project uses the **Manus WebDev managed fullstack template** for the React/Vite application shell, Express server, tRPC transport, Manus OAuth integration, Drizzle/MySQL wiring, storage hooks, and deployment workflow. The starter infrastructure was extended for the HTTP 404 warehouse-planning use case.

## Open-source software

The project is built with and grateful to the maintainers of the following open-source software:

- React and React DOM
- TypeScript
- Vite
- Express
- tRPC
- Drizzle ORM and MySQL/TiDB drivers
- Recharts
- Lucide React
- Vitest
- Zod
- Tailwind CSS and related Radix UI primitives
- pnpm, esbuild, and the broader JavaScript tooling ecosystem

The complete dependency list is available in [`package.json`](./package.json), with exact resolved versions recorded in [`pnpm-lock.yaml`](./pnpm-lock.yaml).

## Typography

The interface uses **Manrope** and **DM Mono**, loaded from Google Fonts in the client shell. These fonts are used for the editorial dashboard hierarchy and compact operational metrics.

## Data provenance

The Bengaluru, Mumbai, and Delhi datasets are realistic generated demo data created for the hackathon prototype. They are not presented as official customer, traffic, or commercial datasets. The application accepts user-provided CSV data for real scenario analysis.

## Map and modeling note

The planning surface is a custom SVG decision map using the supplied latitude/longitude coordinates and a local Euclidean planning projection. The current demo does not claim street-level routing accuracy or live traffic coverage. This keeps the model deterministic and makes every recommendation auditable.

## License

HTTP 404 releases this project under the [MIT License](./LICENSE). Third-party dependencies remain under their respective licenses.
