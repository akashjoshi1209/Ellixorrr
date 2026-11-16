import { notFound } from "next/navigation";

/** Catch-all under a valid locale: unknown paths trigger the localized 404. */
export default function CatchAll() {
  notFound();
}
