import { describe, expect, it } from "vitest";

import { showProjects } from "./handlers/show-projects";
import { filterProjects } from "./handlers/filter-projects";
import { openProject } from "./handlers/open-project";
import { showClients } from "./handlers/show-clients";
import { showExperience } from "./handlers/show-experience";
import { showServices } from "./handlers/show-services";
import { showAbout } from "./handlers/show-about";
import { openContact } from "./handlers/open-contact";
import { resetInterface } from "./handlers/reset-interface";

describe("typed action handlers", () => {
  it("produce only closed host command objects", () => {
    expect(showProjects()).toEqual({ type: "projects.show" });
    expect(filterProjects("Campaign Design")).toEqual({
      type: "projects.filter",
      category: "Campaign Design",
    });
    expect(openProject("diga-yes")).toEqual({
      type: "projects.open",
      slug: "diga-yes",
    });
    expect(showClients()).toEqual({ type: "clients.show" });
    expect(showExperience()).toEqual({ type: "experience.show" });
    expect(showServices()).toEqual({ type: "services.show" });
    expect(showAbout()).toEqual({ type: "about.open" });
    expect(openContact()).toEqual({ type: "contact.open" });
    expect(resetInterface()).toEqual({ type: "interface.reset" });
  });
});
