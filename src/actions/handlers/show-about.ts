import type { HostCommand } from "../schemas";

export function showAbout(): HostCommand {
  return { type: "about.open" };
}
