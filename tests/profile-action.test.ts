import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  from: vi.fn(),
  update: vi.fn(),
  eq: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: vi.fn(async () => ({
    auth: { getUser: mocks.getUser },
    from: mocks.from,
  })),
}));

import { updateProfileAction } from "@/actions/auth";

const REDIRECT_ERROR = "redirect";

describe("profile update action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.eq.mockResolvedValue({ error: null });
    mocks.update.mockReturnValue({ eq: mocks.eq });
    mocks.from.mockReturnValue({ update: mocks.update });
    mocks.getUser.mockResolvedValue({
      data: {
        user: { id: "user-1", email: "verified@example.com" },
      },
    });
  });

  it("writes the verified auth email instead of a submitted address", async () => {
    const formData = new FormData();
    formData.set("locale", "en");
    formData.set("full_name", "Ada Lovelace");
    formData.set("email", "attacker@example.com");
    formData.set("phone", "+919404044607");

    const redirectSpy = vi.fn((target: string) => {
      throw Object.assign(new Error(REDIRECT_ERROR), { path: target });
    });
    mocks.redirect.mockImplementation(redirectSpy);

    await expect(updateProfileAction(formData)).rejects.toMatchObject({
      path: expect.stringContaining("/en/dashboard/profile"),
    });
    expect(mocks.update).toHaveBeenCalledWith({
      full_name: "Ada Lovelace",
      email: "verified@example.com",
      phone: "+919404044607",
    });
    expect(mocks.update).not.toHaveBeenCalledWith(
      expect.objectContaining({ email: "attacker@example.com" })
    );
  });

  it("never writes a profile when the visitor is signed out", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });
    const formData = new FormData();
    formData.set("locale", "en");
    formData.set("full_name", "Ada");
    formData.set("phone", "");

    await expect(updateProfileAction(formData)).rejects.toMatchObject({
      path: expect.stringContaining("/en/auth/login"),
    });
    expect(mocks.from).not.toHaveBeenCalled();
  });
});
