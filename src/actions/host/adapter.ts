import type { HostCommand } from "../schemas";

export type HostEnvironment = "demo" | "portfolio";

export type HostAdapterResult =
  | {
      status: "executed";
      environment: HostEnvironment;
      command: HostCommand;
      message: string;
    }
  | {
      status: "rejected";
      environment: HostEnvironment;
      command: HostCommand;
      message: string;
    };

export interface HostAdapter {
  readonly environment: HostEnvironment;
  dispatch(command: HostCommand): Promise<HostAdapterResult>;
}
