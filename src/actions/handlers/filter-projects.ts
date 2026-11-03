import type { ProjectCategory, HostCommand } from "../schemas";

export function filterProjects(category: ProjectCategory): HostCommand {
  return { type: "projects.filter", category };
}
