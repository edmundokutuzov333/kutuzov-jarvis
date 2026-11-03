import {
  PortfolioActionSchema,
  type PortfolioActionProposal,
  type PortfolioActionId,
  type HostCommand,
} from "./schemas";
import type {
  HostAdapter,
  HostAdapterResult,
} from "./host/adapter";
import { showProjects } from "./handlers/show-projects";
import { filterProjects } from "./handlers/filter-projects";
import { openProject } from "./handlers/open-project";
import { showClients } from "./handlers/show-clients";
import { showExperience } from "./handlers/show-experience";
import { showServices } from "./handlers/show-services";
import { showAbout } from "./handlers/show-about";
import { openContact } from "./handlers/open-contact";
import { resetInterface } from "./handlers/reset-interface";

export interface ActionDescriptor {
  id: PortfolioActionId;
  title: string;
  description: string;
  confirmationRequired: true;
}

export const ACTION_REGISTRY: readonly ActionDescriptor[] = [
  { id: "SHOW_PROJECTS", title: "Mostrar projectos", description: "Abre a listagem pública de projectos.", confirmationRequired: true },
  { id: "FILTER_PROJECTS", title: "Filtrar projectos", description: "Filtra projectos por uma disciplina publicada permitida.", confirmationRequired: true },
  { id: "OPEN_PROJECT", title: "Abrir projecto", description: "Abre um projecto publicado por slug incluído na allowlist.", confirmationRequired: true },
  { id: "SHOW_CLIENTS", title: "Mostrar clientes", description: "Abre a listagem pública de clientes e marcas.", confirmationRequired: true },
  { id: "SHOW_EXPERIENCE", title: "Mostrar experiência", description: "Abre a secção pública de experiência profissional.", confirmationRequired: true },
  { id: "SHOW_SERVICES", title: "Mostrar serviços", description: "Abre a listagem pública de serviços.", confirmationRequired: true },
  { id: "SHOW_ABOUT", title: "Abrir About", description: "Abre a apresentação pública de perfil.", confirmationRequired: true },
  { id: "OPEN_CONTACT", title: "Abrir Contact", description: "Abre a área pública de contacto.", confirmationRequired: true },
  { id: "RESET_INTERFACE", title: "Repor interface", description: "Repõe o estado inicial da interface anfitriã.", confirmationRequired: true },
];

export type ActionRejectionCode =
  | "UNKNOWN_ACTION"
  | "INVALID_PARAMETERS"
  | "CONFIRMATION_REQUIRED"
  | "HOST_REJECTED"
  | "HOST_FAILURE";

export type ActionDispatchResult =
  | {
      status: "executed";
      actionId: PortfolioActionId;
      environment: HostAdapter["environment"];
      command: HostCommand;
      message: string;
    }
  | {
      status: "rejected";
      code: ActionRejectionCode;
      actionId: string | null;
      message: string;
    };

export interface ActionDispatchOptions {
  confirmed?: boolean;
}

function buildHostCommand(action: PortfolioActionProposal): HostCommand {
  switch (action.action) {
    case "SHOW_PROJECTS":
      return showProjects();
    case "FILTER_PROJECTS":
      return filterProjects(action.parameters.category);
    case "OPEN_PROJECT":
      return openProject(action.parameters.slug);
    case "SHOW_CLIENTS":
      return showClients();
    case "SHOW_EXPERIENCE":
      return showExperience();
    case "SHOW_SERVICES":
      return showServices();
    case "SHOW_ABOUT":
      return showAbout();
    case "OPEN_CONTACT":
      return openContact();
    case "RESET_INTERFACE":
      return resetInterface();
    default: {
      const exhaustive: never = action;
      return exhaustive;
    }
  }
}

function getRawActionId(input: unknown): string | null {
  if (typeof input !== "object" || input === null || !("action" in input)) {
    return null;
  }
  return typeof input.action === "string" ? input.action : null;
}

export async function dispatchAction(
  input: unknown,
  host: HostAdapter,
  options: ActionDispatchOptions = {},
): Promise<ActionDispatchResult> {
  const rawActionId = getRawActionId(input);
  const actionId = rawActionId && ACTION_REGISTRY.some((entry) => entry.id === rawActionId)
    ? rawActionId as PortfolioActionId
    : null;

  if (!actionId) {
    return {
      status: "rejected",
      code: "UNKNOWN_ACTION",
      actionId: rawActionId,
      message: "Esta acção não está registada e não pode ser executada.",
    };
  }

  const parsed = PortfolioActionSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: "rejected",
      code: "INVALID_PARAMETERS",
      actionId,
      message: "Os parâmetros da acção não respeitam o schema permitido.",
    };
  }

  if (options.confirmed !== true) {
    return {
      status: "rejected",
      code: "CONFIRMATION_REQUIRED",
      actionId,
      message: "A acção só pode avançar depois de confirmação explícita do visitante.",
    };
  }

  const command = buildHostCommand(parsed.data);
  let hostResult: HostAdapterResult;

  try {
    hostResult = await host.dispatch(command);
  } catch {
    return {
      status: "rejected",
      code: "HOST_FAILURE",
      actionId,
      message: "O adaptador anfitrião não conseguiu processar o comando.",
    };
  }

  if (hostResult.status !== "executed") {
    return {
      status: "rejected",
      code: "HOST_REJECTED",
      actionId,
      message: hostResult.message,
    };
  }

  return {
    status: "executed",
    actionId,
    environment: hostResult.environment,
    command: hostResult.command,
    message: hostResult.message,
  };
}
