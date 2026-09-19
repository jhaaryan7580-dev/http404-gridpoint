# GridPoint release verification

The web-static GridPoint project was upgraded to the managed fullstack template so real Manus OAuth login and protected database-backed scenario storage are available. A `savedScenarios` table and owner-scoped tRPC procedures were added for listing, saving, loading, and deleting private scenario snapshots. The database migration was generated, reviewed, and applied successfully.

The product pass adds persisted light/dark mode, orange/teal/violet accent themes, command search with Cmd/Ctrl+K, workspace/account controls, scenario library UI, map route and catchment toggles, a network-readiness score, highest-delivery-exposure insight, a 90-second decision playbook, and responsive overlay styling. Browser verification confirmed command search, appearance settings, dark mode, signed-out workspace state, and the default Bengaluru cockpit. TypeScript, production build, and the existing auth regression test pass.
