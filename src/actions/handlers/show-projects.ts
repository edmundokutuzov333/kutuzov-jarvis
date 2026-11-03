import type { HostCommand } from "../schemas";

export function showProjects(): HostCommand {
  return { type: "projects.show" };
}
