/**
 * Privacy-safe diagnostics for the public enquiry INSERT.
 *
 * Only fixed category tokens from the allowlists below are ever stored or
 * logged. Raw errors, messages, stacks, URLs, headers, credentials and
 * submitted values are deliberately never inspected for logging.
 */

const TRANSPORT_CATEGORIES = [
  "ENOTFOUND",
  "EAI_AGAIN",
  "ECONNRESET",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "UND_ERR_CONNECT_TIMEOUT",
  "UND_ERR_SOCKET",
  "UND_ERR_HEADERS_TIMEOUT",
  "UND_ERR_BODY_TIMEOUT",
  "UND_ERR_HEADERS_OVERFLOW",
  "CERT_HAS_EXPIRED",
  "UNABLE_TO_VERIFY_LEAF_SIGNATURE",
  "SELF_SIGNED_CERT_IN_CHAIN",
  "ABORT_ERR",
  "TimeoutError",
  "AbortError",
] as const;

type TransportCategory = (typeof TRANSPORT_CATEGORIES)[number];

export type EnquiryTransport =
  | TransportCategory
  | "other"
  | "none";

type RejectedTransport = Exclude<EnquiryTransport, "none">;

const ALLOWED_CATEGORIES: ReadonlySet<string> = new Set<string>(
  TRANSPORT_CATEGORIES
);

const ALLOWED_TRANSPORTS: ReadonlySet<string> = new Set<string>([
  ...TRANSPORT_CATEGORIES,
  "other",
  "none",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** Reads an own property descriptor without invoking getters or proxies. */
function readOwnValue(value: unknown, key: string): unknown {
  if (!isRecord(value)) return undefined;
  const descriptor = Object.getOwnPropertyDescriptor(value, key);
  return descriptor && "value" in descriptor
    ? descriptor.value
    : undefined;
}

function readOwnString(
  value: unknown,
  key: "code" | "name"
): string | undefined {
  const candidate = readOwnValue(value, key);
  return typeof candidate === "string" ? candidate : undefined;
}

/**
 * Maps a thrown value to a fixed category by inspecting only `code`, `name`
 * and up to three nested `cause` levels. No arbitrary string is returned.
 */
function classifyTransportError(error: unknown): RejectedTransport {
  let current: unknown = error;

  for (let depth = 0; depth <= 3; depth += 1) {
    const code = readOwnString(current, "code");
    if (code !== undefined && ALLOWED_CATEGORIES.has(code)) {
      return code as TransportCategory;
    }

    const name = readOwnString(current, "name");
    if (name !== undefined && ALLOWED_CATEGORIES.has(name)) {
      return name as TransportCategory;
    }

    current = readOwnValue(current, "cause");
    if (current === undefined) break;
  }

  return "other";
}

function normalizeTransport(value: unknown): EnquiryTransport {
  return typeof value === "string" && ALLOWED_TRANSPORTS.has(value)
    ? (value as EnquiryTransport)
    : "other";
}

/**
 * Request-scoped fetch probe. Each call owns its own state, so concurrent
 * enquiries cannot share a classification.
 */
export function createEnquiryFetchProbe(): {
  fetch: typeof globalThis.fetch;
  getTransport: () => EnquiryTransport;
} {
  let transport: EnquiryTransport = "none";

  const fetch: typeof globalThis.fetch = async (input, init) => {
    try {
      return await globalThis.fetch(input, init);
    } catch (error: unknown) {
      try {
        transport = classifyTransportError(error);
      } catch {
        transport = "other";
      }
      throw error;
    }
  };

  return { fetch, getTransport: () => transport };
}

/** Logs only validated code, bounded status and allowlisted transport. */
export function logEnquiryInsertError(
  error: { code: string },
  status: number,
  transport: EnquiryTransport
): void {
  const code =
    typeof error.code === "string" &&
    /^[A-Z0-9]{1,12}$/.test(error.code)
      ? error.code
      : "unknown";

  const safeStatus =
    Number.isInteger(status) && status >= 0 && status <= 599
      ? status
      : null;

  console.error(
    "[CONTACT_ENQUIRY_INSERT_FAILED]",
    JSON.stringify({
      code,
      status: safeStatus,
      transport: normalizeTransport(transport),
    })
  );
}
