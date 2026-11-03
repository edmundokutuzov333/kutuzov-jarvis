import type { HostCommand } from "../schemas";

export function openContact(): HostCommand {
  return { type: "contact.open" };
}
