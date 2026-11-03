import type { HostCommand } from "../schemas";

export function showClients(): HostCommand {
  return { type: "clients.show" };
}
