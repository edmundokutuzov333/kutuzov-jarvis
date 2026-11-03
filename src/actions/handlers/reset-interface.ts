import type { HostCommand } from "../schemas";

export function resetInterface(): HostCommand {
  return { type: "interface.reset" };
}
