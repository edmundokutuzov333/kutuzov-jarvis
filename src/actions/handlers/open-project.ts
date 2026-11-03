import type { PublishedProjectSlug, HostCommand } from "../schemas";

export function openProject(slug: PublishedProjectSlug): HostCommand {
  return { type: "projects.open", slug };
}
