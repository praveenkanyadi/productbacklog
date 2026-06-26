/**
 * Mock auth - replace with real auth when ready.
 * For demo: use env EDM_MOCK_USER_ID or localStorage edm_demo_user to switch roles.
 */
export const MOCK_ORG_ID = "org-1";

export const DEMO_USERS = {
  "user-1": {
    id: "user-1",
    name: "Demo User",
    email: "demo@example.com",
    orgId: MOCK_ORG_ID,
    role: "employee" as const,
  },
  "user-2": {
    id: "user-2",
    name: "Manager User",
    email: "manager@example.com",
    orgId: MOCK_ORG_ID,
    role: "manager" as const,
  },
  "user-3": {
    id: "user-3",
    name: "Delegatee User",
    email: "delegatee@example.com",
    orgId: MOCK_ORG_ID,
    role: "manager" as const,
  },
  "pm-1": {
    id: "pm-1",
    name: "Sarah Mitchell",
    email: "sarah.mitchell@tcpsoftware.com",
    orgId: MOCK_ORG_ID,
    role: "pm" as const,
  },
  "pm-2": {
    id: "pm-2",
    name: "Alex Kim",
    email: "alex.kim@tcpsoftware.com",
    orgId: MOCK_ORG_ID,
    role: "pm" as const,
  },
  "eng-1": {
    id: "eng-1",
    name: "Ryan Chen",
    email: "ryan.chen@tcpsoftware.com",
    orgId: MOCK_ORG_ID,
    role: "engineering" as const,
  },
  "exec-1": {
    id: "exec-1",
    name: "Dana Wu",
    email: "dana.wu@tcpsoftware.com",
    orgId: MOCK_ORG_ID,
    role: "executive" as const,
  },
} as const;

export const MOCK_USER_ID = "user-1";
export const MOCK_USER = DEMO_USERS["user-1"];

function getDemoUserOverride(): string | null {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("edm_demo_user");
    if (stored && stored in DEMO_USERS) return stored;
  }
  return null;
}

export function getCurrentUser() {
  const override = getDemoUserOverride();
  if (override && override in DEMO_USERS) {
    return DEMO_USERS[override as keyof typeof DEMO_USERS];
  }
  return MOCK_USER;
}

export function setDemoUser(userId: keyof typeof DEMO_USERS) {
  if (typeof window !== "undefined") {
    localStorage.setItem("edm_demo_user", userId);
    window.location.reload();
  }
}
