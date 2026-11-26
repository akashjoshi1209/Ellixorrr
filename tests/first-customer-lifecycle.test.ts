/**
 * Phase 5 — synthetic first-customer lifecycle simulation.
 *
 * This exercises the REAL Server Actions and authorization helpers against an
 * in-memory Supabase-shaped fake. It proves action-level sequencing, payload
 * shape, allowlisted feedback and role gating WITHOUT a database.
 *
 * It explicitly does NOT prove RLS, real persistence, email delivery, session
 * refresh or any live/staging behavior. Those require a verified isolated
 * Supabase environment and are documented as unverified in
 * reports/phase-5/FIRST_CUSTOMER_DRY_RUN.md.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const ADMIN_ID = "22222222-2222-4222-8222-222222222222";
const CUSTOMER_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_CUSTOMER_ID = "33333333-3333-4333-8333-333333333333";

type Row = Record<string, unknown> & { id: string };

const mocks = vi.hoisted(() => ({
  redirect: vi.fn(),
  revalidatePath: vi.fn(),
  getUser: vi.fn(),
  from: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

const store: {
  enquiries: Row[];
  profiles: Row[];
  projects: Row[];
  project_updates: Row[];
} = {
  enquiries: [],
  profiles: [],
  projects: [],
  project_updates: [],
};

let currentUser: { id: string; email: string } | null = null;
let sequence = 0;

function syntheticId(): string {
  sequence += 1;
  return `00000000-0000-4000-8000-${String(sequence).padStart(12, "0")}`;
}

function makeBuilder(table: keyof typeof store) {
  const filters: Array<{ column: string; value: unknown }> = [];
  let updatePayload: Record<string, unknown> | null = null;

  const matching = (): Row[] =>
    store[table].filter((row) =>
      filters.every((filter) => row[filter.column] === filter.value)
    );

  const builder = {
    insert(payload: Record<string, unknown>) {
      const row: Row = {
        id: syntheticId(),
        created_at: "2026-11-25T00:00:00.000Z",
        ...payload,
      };
      store[table].push(row);
      return Promise.resolve({ data: [row], error: null });
    },
    update(payload: Record<string, unknown>) {
      updatePayload = payload;
      return builder;
    },
    eq(column: string, value: unknown) {
      filters.push({ column, value });
      return builder;
    },
    select() {
      return builder;
    },
    order() {
      return builder;
    },
    maybeSingle() {
      return Promise.resolve({ data: matching()[0] ?? null, error: null });
    },
    then(
      resolve: (value: unknown) => unknown,
      reject?: (reason: unknown) => unknown
    ) {
      if (updatePayload) {
        const rows = matching();
        for (const row of rows) Object.assign(row, updatePayload);
        return Promise.resolve({
          data: rows.map((row) => ({ id: row.id })),
          error: null,
        }).then(resolve, reject);
      }
      return Promise.resolve({ data: matching(), error: null }).then(
        resolve,
        reject
      );
    },
  };

  return builder;
}

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: vi.fn(async () => ({
    auth: {
      getUser: mocks.getUser,
    },
    from: mocks.from,
  })),
}));

import { adminCreateProject, adminCreateProjectUpdate, adminUpdateEnquiryStatus } from "@/actions/admin";
import { submitEnquiryAction } from "@/actions/auth";
import { requireAdmin, requireCustomer } from "@/lib/profiles";

function formData(values: Record<string, string>, locale = "en"): FormData {
  const result = new FormData();
  result.set("locale", locale);
  for (const [key, value] of Object.entries(values)) result.set(key, value);
  return result;
}

async function expectRedirect(
  promise: Promise<unknown>,
  pathFragment: string
): Promise<void> {
  await expect(promise).rejects.toMatchObject({
    path: expect.stringContaining(pathFragment),
  });
}

const validEnquiry = {
  name: "Synthetic Visitor",
  email: "synthetic.visitor@example.test",
  phone: "+910000000000",
  business_name: "Synthetic Test Business",
  service_type: "Websites",
  project_description: "Synthetic lifecycle enquiry; not a real customer.",
};

describe("synthetic first-customer lifecycle (in-memory, not a database test)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sequence = 0;
    store.enquiries = [];
    store.projects = [];
    store.project_updates = [];
    store.profiles = [
      {
        id: ADMIN_ID,
        role: "admin",
        email: "synthetic.admin@example.test",
        full_name: "Synthetic Admin",
        phone: null,
        created_at: "2026-11-25T00:00:00.000Z",
      },
      {
        id: CUSTOMER_ID,
        role: "customer",
        email: "synthetic.customer@example.test",
        full_name: "Synthetic Customer",
        phone: null,
        created_at: "2026-11-25T00:00:00.000Z",
      },
      {
        id: OTHER_CUSTOMER_ID,
        role: "customer",
        email: "synthetic.other@example.test",
        full_name: "Synthetic Other Customer",
        phone: null,
        created_at: "2026-11-25T00:00:00.000Z",
      },
    ];
    currentUser = null;
    mocks.getUser.mockImplementation(async () => ({
      data: { user: currentUser },
      error: null,
    }));
    mocks.from.mockImplementation((table: string) =>
      makeBuilder(table as keyof typeof store)
    );
    mocks.redirect.mockImplementation((target: string) => {
      throw Object.assign(new Error("NEXT_REDIRECT"), { path: target });
    });
  });

  it("walks enquiry, admin review, project, update and customer-scoped visibility", async () => {
    // Step 1 — invalid anonymous enquiry is rejected with an allowlisted code.
    const invalid = await submitEnquiryAction(
      formData({ ...validEnquiry, email: "not-an-email" })
    );
    expect(invalid).toEqual({ error: "validation_failed" });
    expect(store.enquiries).toHaveLength(0);

    // Step 2 — valid anonymous enquiry persists with status 'new' and null owner.
    const submitted = await submitEnquiryAction(formData(validEnquiry));
    expect(submitted).toEqual({ success: "enquiry_submitted" });
    expect(store.enquiries).toHaveLength(1);
    expect(store.enquiries[0]).toMatchObject({
      status: "new",
      customer_id: null,
      service_type: "Websites",
      name: "Synthetic Visitor",
    });

    // Step 3 — admin reviews and moves the canonical status forward.
    currentUser = { id: ADMIN_ID, email: "synthetic.admin@example.test" };
    expect(await requireAdmin("en")).toMatchObject({ role: "admin" });

    const enquiryId = store.enquiries[0].id;
    await expectRedirect(
      adminUpdateEnquiryStatus(
        formData({ enquiry_id: enquiryId, status: "reviewing" })
      ),
      "/en/admin/enquiries"
    );
    expect(store.enquiries[0].status).toBe("reviewing");

    await expectRedirect(
      adminUpdateEnquiryStatus(
        formData({ enquiry_id: enquiryId, status: "converted" })
      ),
      "message=enquiry_status_updated"
    );
    expect(store.enquiries[0].status).toBe("converted");

    // Step 4 — a customer cannot reach the admin action.
    currentUser = {
      id: CUSTOMER_ID,
      email: "synthetic.customer@example.test",
    };
    await expectRedirect(
      adminCreateProject(
        formData({
          customer_id: CUSTOMER_ID,
          project_name: "Unauthorized project",
          service_type: "Websites",
        })
      ),
      "/en/dashboard"
    );
    expect(store.projects).toHaveLength(0);

    // Step 5 — admin creates a project with the default canonical status.
    currentUser = { id: ADMIN_ID, email: "synthetic.admin@example.test" };
    await expectRedirect(
      adminCreateProject(
        formData({
          customer_id: CUSTOMER_ID,
          project_name: "Synthetic Website Project",
          service_type: "Websites",
          description: "Synthetic lifecycle project; not a real customer.",
          status: "enquiry",
        })
      ),
      "message=project_created"
    );
    expect(store.projects).toHaveLength(1);
    expect(store.projects[0]).toMatchObject({
      customer_id: CUSTOMER_ID,
      status: "enquiry",
      service_type: "Websites",
    });

    // Step 6 — admin adds a project update; author comes from the profile.
    const projectId = store.projects[0].id;
    await expectRedirect(
      adminCreateProjectUpdate(
        formData({
          project_id: projectId,
          title: "Synthetic kickoff update",
          description: "Recorded only in the in-memory simulation.",
        })
      ),
      "message=project_update_created"
    );
    expect(store.project_updates).toHaveLength(1);
    expect(store.project_updates[0]).toMatchObject({
      project_id: projectId,
      author_id: ADMIN_ID,
      title: "Synthetic kickoff update",
    });

    // Step 7 — another customer's project exists but is not in the scoped read.
    store.projects.push({
      id: syntheticId(),
      customer_id: OTHER_CUSTOMER_ID,
      project_name: "Other customer project",
      service_type: "Applications",
      description: null,
      status: "enquiry",
      created_at: "2026-11-25T00:00:00.000Z",
    });
    currentUser = {
      id: CUSTOMER_ID,
      email: "synthetic.customer@example.test",
    };
    const customer = await requireCustomer("en");
    const visible = await mocks
      .from("projects")
      .select("id, project_name")
      .eq("customer_id", customer.id);
    expect(visible.data).toHaveLength(1);
    expect(visible.data[0]).toMatchObject({ customer_id: CUSTOMER_ID });
    expect(
      visible.data.some(
        (row: Row) => row.customer_id === OTHER_CUSTOMER_ID
      )
    ).toBe(false);

    // Step 8 — expired session cannot enter the customer portal.
    currentUser = null;
    await expectRedirect(requireCustomer("en"), "/en/auth/login");
  });

  it("keeps the canonical status vocabulary closed to unknown values", async () => {
    currentUser = { id: ADMIN_ID, email: "synthetic.admin@example.test" };
    store.enquiries.push({
      id: syntheticId(),
      status: "new",
      customer_id: null,
      name: "Synthetic Visitor",
      email: "synthetic.visitor@example.test",
      phone: null,
      business_name: null,
      service_type: "Websites",
      project_description: "Synthetic.",
      created_at: "2026-11-25T00:00:00.000Z",
    });

    await expectRedirect(
      adminUpdateEnquiryStatus(
        formData({
          enquiry_id: store.enquiries[0].id,
          status: "super_admin",
        })
      ),
      "error=validation_failed"
    );
    expect(store.enquiries[0].status).toBe("new");
  });
});
