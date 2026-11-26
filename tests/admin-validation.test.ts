import { describe, expect, it } from "vitest";
import {
  adminCreateProjectSchema,
  adminCreateProjectUpdateSchema,
  adminUpdateProjectSchema,
} from "@/lib/validations";

const CUSTOMER_ID = "3f333df6-90a4-4fda-8dd3-9485d27cee36";
const PROJECT_ID = "9d0c50a8-77cb-4ad4-8f46-2a0b6b4f1d31";

const validProject = {
  customer_id: CUSTOMER_ID,
  project_name: "Customer portal",
  service_type: "Applications",
  description: "A secure portal for customer updates.",
  status: "in_progress",
};

describe("admin project validation", () => {
  it("accepts HTML date values and normalizes an empty date to undefined", () => {
    const result = adminCreateProjectSchema.safeParse({
      ...validProject,
      start_date: "2026-01-02",
      expected_completion_date: "",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.start_date).toBe("2026-01-02");
      expect(result.data.expected_completion_date).toBeUndefined();
    }
  });

  it("rejects impossible and non-HTML date values", () => {
    for (const start_date of ["2026-02-30", "02/03/2026", "2026-1-2"]) {
      expect(
        adminCreateProjectSchema.safeParse({
          ...validProject,
          start_date,
        }).success
      ).toBe(false);
    }
  });

  it("requires a customer when updating a project", () => {
    const result = adminUpdateProjectSchema.safeParse({
      project_name: validProject.project_name,
      service_type: validProject.service_type,
      description: validProject.description,
      status: validProject.status,
      project_id: PROJECT_ID,
    });
    expect(result.success).toBe(false);

    const valid = adminUpdateProjectSchema.safeParse({
      ...validProject,
      project_id: PROJECT_ID,
    });
    expect(valid.success).toBe(true);
  });

  it("accepts an empty update description but enforces the length cap", () => {
    const empty = adminCreateProjectUpdateSchema.safeParse({
      project_id: PROJECT_ID,
      title: "Discovery complete",
      description: "",
    });
    expect(empty.success).toBe(true);

    const tooLong = adminCreateProjectUpdateSchema.safeParse({
      project_id: PROJECT_ID,
      title: "Discovery complete",
      description: "x".repeat(5001),
    });
    expect(tooLong.success).toBe(false);
  });
});
