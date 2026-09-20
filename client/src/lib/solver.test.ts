import { describe, expect, it } from "vitest";
import {
  DEFAULT_PARAMS,
  buildCenters,
  parseDemandCsv,
  parseDemandJson,
  parseDemandWhitespace,
  solveNetwork,
} from "./solver";
import type { DemandNode, Params } from "./solver";

const nodes: DemandNode[] = [
  { id: "a", name: "A", lat: 12.9, lon: 77.5, orders: 100 },
  { id: "b", name: "B", lat: 13.0, lon: 77.6, orders: 200 },
  { id: "c", name: "C", lat: 13.1, lon: 77.7, orders: 50 },
];

const params = (patch: Partial<Params> = {}): Params => ({ ...DEFAULT_PARAMS, k: 2, useRadius: false, ...patch });

describe("GridPoint client model", () => {
  it("preserves the cost identity", () => {
    const result = solveNetwork(nodes, params());
    expect(result.deliveryCost + result.infraCost).toBeCloseTo(result.totalCost, 8);
  });

  it("is deterministic for identical inputs", () => {
    const first = solveNetwork(nodes, params());
    const second = solveNetwork(nodes, params());
    expect(second).toEqual(first);
  });

  it("flags capacity overflow instead of silently hiding it", () => {
    const result = solveNetwork(nodes, params({ k: 1, useCapacity: true, capacity: 50 }));
    expect(result.hubs).toHaveLength(1);
    expect(result.hubs[0].overCapacity).toBe(true);
    expect(result.hubs[0].load).toBe(350);
  });

  it("counts radius violations and reduces service coverage", () => {
    const result = solveNetwork(nodes, params({ k: 1, useRadius: true, radius: 3 }), [{ lat: 12.9, lon: 77.5 }]);
    expect(result.radiusViolations).toBeGreaterThan(0);
    expect(result.uncovered.length).toBe(result.radiusViolations);
    expect(result.coverage).toBeLessThan(100);
  });

  it("rounds surge demand per node and increases total orders", () => {
    const base = solveNetwork(nodes, params());
    const surge = solveNetwork(nodes, params({ surge: 15 }));
    expect(surge.totalOrders).toBeGreaterThan(base.totalOrders);
    expect(surge.scenarioNodes.map((node) => node.adjustedOrders)).toEqual([115, 230, 57]);
  });

  it("keeps requested centers distinct when enough demand sites exist", () => {
    const centers = buildCenters(nodes.map((node) => ({ ...node, adjustedOrders: node.orders })), 3, "kmeans");
    expect(new Set(centers.map((center) => `${center.lat},${center.lon}`)).size).toBe(3);
  });

  it("parses BOM headers, quoted commas, and semicolon delimiters", () => {
    const result = parseDemandCsv("\uFEFFneighborhood;latitude;longitude;daily_orders\n\"Koramangala, South\";12.9352;77.6245;610");
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ name: "Koramangala, South", lat: 12.9352, lon: 77.6245, orders: 610 });
  });

  it("parses JSON aliases and whitespace-delimited text", () => {
    expect(parseDemandJson(JSON.stringify([{ neighborhood: "A", latitude: 12.9, longitude: 77.5, daily_orders: 42 }]))[0]).toMatchObject({ name: "A", orders: 42 });
    expect(parseDemandWhitespace("neighborhood lat lon orders\nA 12.9 77.5 42")[0]).toMatchObject({ name: "A", lat: 12.9, lon: 77.5, orders: 42 });
  });
});
