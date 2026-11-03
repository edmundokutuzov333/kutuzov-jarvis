import {
  HostCommandSchema,
  type HostCommand,
  type ProjectCategory,
  type PublishedProjectSlug,
} from "../schemas";
import type {
  HostAdapter,
  HostAdapterResult,
} from "./adapter";

export type DemoPortfolioView =
  | "home"
  | "projects"
  | "clients"
  | "experience"
  | "services"
  | "about"
  | "contact";

export interface DemoPortfolioState {
  view: DemoPortfolioView;
  projectCategory: ProjectCategory | null;
  activeProjectSlug: PublishedProjectSlug | null;
}

export class DemoPortfolioHostAdapter implements HostAdapter {
  readonly environment = "demo" as const;
  #state: DemoPortfolioState = {
    view: "home",
    projectCategory: null,
    activeProjectSlug: null,
  };
  #events: HostCommand[] = [];

  getSnapshot(): Readonly<DemoPortfolioState> {
    return { ...this.#state };
  }

  getEventLog(): readonly HostCommand[] {
    return this.#events.map((event) => ({ ...event }));
  }

  async dispatch(command: HostCommand): Promise<HostAdapterResult> {
    const validated = HostCommandSchema.safeParse(command);
    if (!validated.success) {
      return {
        status: "rejected",
        environment: this.environment,
        command,
        message: "O comando anfitrião não respeita o contrato permitido.",
      };
    }

    const safeCommand = validated.data;
    this.#events.push(safeCommand);

    switch (safeCommand.type) {
      case "projects.show":
        this.#state = { view: "projects", projectCategory: null, activeProjectSlug: null };
        break;
      case "projects.filter":
        this.#state = { view: "projects", projectCategory: safeCommand.category, activeProjectSlug: null };
        break;
      case "projects.open":
        this.#state = { view: "projects", projectCategory: null, activeProjectSlug: safeCommand.slug };
        break;
      case "clients.show":
        this.#state = { view: "clients", projectCategory: null, activeProjectSlug: null };
        break;
      case "experience.show":
        this.#state = { view: "experience", projectCategory: null, activeProjectSlug: null };
        break;
      case "services.show":
        this.#state = { view: "services", projectCategory: null, activeProjectSlug: null };
        break;
      case "about.open":
        this.#state = { view: "about", projectCategory: null, activeProjectSlug: null };
        break;
      case "contact.open":
        this.#state = { view: "contact", projectCategory: null, activeProjectSlug: null };
        break;
      case "interface.reset":
        this.#state = { view: "home", projectCategory: null, activeProjectSlug: null };
        break;
      default: {
        const exhaustive: never = safeCommand;
        return {
          status: "rejected",
          environment: this.environment,
          command: exhaustive,
          message: "Comando anfitrião não suportado.",
        };
      }
    }

    return {
      status: "executed",
      environment: this.environment,
      command: safeCommand,
      message: "Comando executado no adaptador de demonstração isolado. Nenhuma página ou dado do portefólio real foi alterado.",
    };
  }
}
