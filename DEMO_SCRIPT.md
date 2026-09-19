# HTTP 404 — 2–3 minute demo script

## 0:00–0:20 — The problem

“Warehouse placement is a network decision, not just a map pin. High-demand neighborhoods should pull hubs closer, but every extra hub adds fixed infrastructure cost. HTTP 404 turns that trade-off into an explainable decision.”

If asked about exact optimization, say: “This release uses a deterministic weighted clustering heuristic so interactive drag sensitivity and scenario comparisons stay immediate. An exact capacitated MILP is a planned backend evolution once the candidate-hub policy and asynchronous solver contract are fixed.”

## 0:20–0:45 — Start with demand

“Here is the Bengaluru baseline. The editable table contains neighborhood coordinates and daily orders. We can load Mumbai or Delhi presets, or upload a CSV with `name`, `lat`, `lon`, and `orders`. The live network model immediately shows demand nodes, hub candidates, assignments, and the current service-radius ring.”

Point to the recommendation, total cost, weighted average leg, service level, and readiness score.

## 0:45–1:15 — Explain the optimization

“GridPoint uses daily orders as the weight in a demand-weighted k-means or k-medoids model. Busy neighborhoods pull hubs more strongly. The objective is delivery distance multiplied by orders and cost per kilometer, plus a fixed cost per active hub. The result is not a black box: every assignment, distance, and cost is visible in the audit view.”

Open the **Assignments** tab briefly to show the colored hub badges and radius statuses.

## 1:15–1:40 — Show sensitivity analysis

“Now I will drag H1. This is the core sensitivity feature. The hub moves on the map and the application immediately recalculates neighborhood assignments, total cost, weighted average leg, modeled savings, and service exceptions. The recommendation label changes to show that this is a manual sensitivity layout.”

Drag the hub and point to the recalculating indicator or changed map lines.

## 1:40–2:00 — Test resilience

“Let us add a peak-day profile. The +15% and +30% scenarios keep geography constant but raise demand, so we can see how cost and savings change. The service-radius slider exposes nodes beyond the operating threshold, and capacity constraints can surface overloaded hubs.”

Click **+15%**, then show the scenario comparison table.

## 2:00–2:20 — Make the decision auditable

“The decision brief separates variable delivery cost from fixed infrastructure cost. The cost curve shows the trade-off across hub counts. We can download assignments CSV, download the cost summary, or generate a printable decision report.”

Open the cost curve or click the report control.

## 2:20–2:40 — Close with continuity

“Finally, a signed-in team member can save the winning network to the private HTTP 404 workspace and restore it later. Dark mode, accent customization, command search, and the decision playbook make the cockpit usable in a real review—not just a one-time demo.”

Close with: “HTTP 404 turns raw demand into a defensible warehouse decision.”
