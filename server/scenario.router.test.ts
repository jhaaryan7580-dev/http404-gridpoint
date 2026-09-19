import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const persistence = vi.hoisted(() => ({
  createSavedScenario: vi.fn(),
  deleteSavedScenario: vi.fn(),
  listSavedScenarios: vi.fn(),
}));

vi.mock("./db", () => persistence);

import { appRouter } from "./routers";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

const snapshot = {
  version: 1 as const,
  nodes: [
    { id: "north", name: "North", lat: 12.98, lon: 77.6, orders: 200 },
    { id: "south", name: "South", lat: 12.9, lon: 77.62, orders: 150 },
  ],
  params: {
    k: 2,
    algorithm: "kmeans" as const,
    costPerKm: 2,
    fixedCost: 500,
    useVehicles: false,
    useCapacity: false,
    capacity: 1800,
    useRadius: true,
    radius: 8,
    surge: 0,
  },
  manualHubs: null,
};

function context(userId = 42): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `user-${userId}`,
    name: "HTTP 404 Tester",
    email: "tester@example.com",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return { user, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("scenario router", () => {
  it("lists only the caller's saved scenarios", async () => {
    const rows = [{ id: 9, userId: 42, name: "Mumbai peak", dataset: "Mumbai", payload: JSON.stringify(snapshot), createdAt: new Date(), updatedAt: new Date() }];
    persistence.listSavedScenarios.mockResolvedValue(rows);

    const result = await appRouter.createCaller(context(42)).scenario.list();

    expect(persistence.listSavedScenarios).toHaveBeenCalledWith(42);
    expect(result).toEqual(rows);
  });

  it("saves a validated snapshot against the authenticated user", async () => {
    persistence.createSavedScenario.mockResolvedValue(undefined);

    const result = await appRouter.createCaller(context(42)).scenario.save({ name: "Bengaluru base", dataset: "Bengaluru", snapshot });

    expect(result).toEqual({ success: true });
    expect(persistence.createSavedScenario).toHaveBeenCalledWith(42, expect.objectContaining({
      name: "Bengaluru base",
      dataset: "Bengaluru",
    }));
    const stored = persistence.createSavedScenario.mock.calls[0]?.[1];
    expect(JSON.parse(stored.payload)).toEqual(snapshot);
  });

  it("rejects malformed scenario inputs before persistence", async () => {
    await expect(appRouter.createCaller(context()).scenario.save({
      name: "Invalid",
      dataset: "Bengaluru",
      snapshot: { ...snapshot, params: { ...snapshot.params, k: 0 } },
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });

    expect(persistence.createSavedScenario).not.toHaveBeenCalled();
  });

  it("passes the caller identity into delete so persistence remains owner-scoped", async () => {
    persistence.deleteSavedScenario.mockResolvedValue(undefined);

    const result = await appRouter.createCaller(context(42)).scenario.delete({ id: 17 });

    expect(result).toEqual({ success: true });
    expect(persistence.deleteSavedScenario).toHaveBeenCalledWith(42, 17);
  });

  it("does not expose scenario actions to unauthenticated callers", async () => {
    const unauthenticated = { user: null, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] } as TrpcContext;

    await expect(appRouter.createCaller(unauthenticated).scenario.list()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(persistence.listSavedScenarios).not.toHaveBeenCalled();
  });
});
