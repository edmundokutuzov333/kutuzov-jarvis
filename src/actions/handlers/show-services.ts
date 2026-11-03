import type { HostCommand } from "../schemas";

export function showServices(): HostCommand {
  return { type: "services.show" };
}
