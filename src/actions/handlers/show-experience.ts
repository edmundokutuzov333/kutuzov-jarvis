import type { HostCommand } from "../schemas";

export function showExperience(): HostCommand {
  return { type: "experience.show" };
}
