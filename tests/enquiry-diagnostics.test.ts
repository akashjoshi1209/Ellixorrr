import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createEnquiryFetchProbe,
  logEnquiryInsertError,
  type EnquiryTransport,
} from "@/lib/supabase/enquiry-diagnostics";

afterEach(() => {
  vi.restoreAllMocks();
});

async function expectTransportFor(
  thrown: unknown,
  expected: Exclude<EnquiryTransport, "none">
): Promise<void> {
  vi.spyOn(globalThis, "fetch").mockImplementation(() =>
    Promise.reject(thrown)
  );

  const probe = createEnquiryFetchProbe();
  await expect(probe.fetch("https://example.test/rest/v1/enquiries")).rejects.toBe(
    thrown
  );
  expect(probe.getTransport()).toBe(expected);
}

describe("enquiry transport diagnostics", () => {
  it("leaves transport as none when fetch succeeds", async () => {
    const response = new Response("ok", { status: 200 });
    vi.spyOn(globalThis, "fetch").mockImplementation(async () => response);
    const consoleSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    const probe = createEnquiryFetchProbe();
    const result = await probe.fetch("https://example.test/rest/v1/enquiries");

    expect(result).toBe(response);
    expect(probe.getTransport()).toBe("none");
    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it.each(["ENOTFOUND", "ECONNRESET", "UND_ERR_CONNECT_TIMEOUT"] as const)(
    "classifies %s from a rejected fetch",
    async (code) => {
      const error = Object.assign(new Error("secret@example.com"), { code });
      await expectTransportFor(error, code);
    }
  );

  it("recognizes an allowlisted code nested three cause levels deep", async () => {
    const nested: unknown = {
      name: "TypeError",
      message: "fetch failed secret@example.com",
      cause: {
        name: "Error",
        message: "secret",
        cause: {
          name: "Error",
          message: "secret",
          cause: {
            code: "ECONNREFUSED",
            message: "secret",
          },
        },
      },
    };

    await expectTransportFor(nested, "ECONNREFUSED");
  });

  it("maps unrecognized errors to the fixed other category", async () => {
    const error = Object.assign(new Error("customer@example.com"), {
      code: "CUSTOM_SECRET_VALUE",
    });
    await expectTransportFor(error, "other");
  });

  it("rethrows the original error object unchanged", async () => {
    const error = Object.assign(new Error("raw failure details"), {
      code: "ETIMEDOUT",
    });
    await expectTransportFor(error, "ETIMEDOUT");
  });

  it("keeps classification state separate for concurrent probes", async () => {
    const failure = Object.assign(new Error("secret@example.com"), {
      code: "ENOTFOUND",
    });
    const response = new Response("ok", { status: 200 });

    vi.spyOn(globalThis, "fetch").mockImplementation((input) => {
      return String(input).includes("fail")
        ? Promise.reject(failure)
        : Promise.resolve(response);
    });

    const failingProbe = createEnquiryFetchProbe();
    const succeedingProbe = createEnquiryFetchProbe();

    const [failed, succeeded] = await Promise.allSettled([
      failingProbe.fetch("https://fail.test/rest/v1/enquiries"),
      succeedingProbe.fetch("https://ok.test/rest/v1/enquiries"),
    ]);

    expect(failed.status).toBe("rejected");
    expect(succeeded.status).toBe("fulfilled");
    expect(failingProbe.getTransport()).toBe("ENOTFOUND");
    expect(succeedingProbe.getTransport()).toBe("none");
  });

  it("uses none for an HTTP error response without a fetch rejection", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(
      async () => new Response(null, { status: 500 })
    );

    const probe = createEnquiryFetchProbe();
    const result = await probe.fetch("https://example.test/rest/v1/enquiries");

    expect(result.status).toBe(500);
    expect(probe.getTransport()).toBe("none");
  });

  it("logs only validated code, status and allowlisted transport", async () => {
    const consoleSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const unsafeError = {
      code: "42501",
      message: "customer@example.com",
      hint: "Business name: Acme",
      details: "+919404044607 project description",
    };

    const thrown = Object.assign(new Error("secret@example.com"), {
      code: "ECONNRESET",
    });
    vi.spyOn(globalThis, "fetch").mockImplementation(() =>
      Promise.reject(thrown)
    );
    const probe = createEnquiryFetchProbe();
    await expect(probe.fetch("https://example.test/key=secret")).rejects.toBe(
      thrown
    );

    logEnquiryInsertError(unsafeError, 403, probe.getTransport());

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    const firstCall = consoleSpy.mock.calls[0];
    expect(firstCall?.[0]).toBe("[CONTACT_ENQUIRY_INSERT_FAILED]");
    expect(firstCall?.[1]).toBe(
      '{"code":"42501","status":403,"transport":"ECONNRESET"}'
    );

    const payload = String(firstCall?.[1]);
    for (const secret of [
      "customer@example.com",
      "secret@example.com",
      "Acme",
      "+919404044607",
      "project description",
      "key=secret",
      "raw failure details",
    ]) {
      expect(payload).not.toContain(secret);
    }
  });
});
