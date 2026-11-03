import type { KnowledgeEntry } from "../knowledge/schema";

interface ProjectDeckProps {
  projects: KnowledgeEntry[];
  onOpenProject: (project: KnowledgeEntry) => void;
}

function metadata(project: KnowledgeEntry, key: string): string {
  const value = project.metadata[key];
  return typeof value === "string" || typeof value === "number" ? String(value) : "";
}

export function ProjectDeck({ projects, onOpenProject }: ProjectDeckProps) {
  const palettes = ["violet", "cyan", "blue", "rose"];
  return (
    <section className="project-deck" aria-label="Projectos apresentados pelo JARVIS">
      <div className="project-deck__heading"><span>WORK / SELECTED</span><small>Abre cada trabalho numa janela</small></div>
      <div className="project-deck__grid">
        {projects.slice(0, 4).map((project, index) => {
          const client = metadata(project, "client");
          const year = metadata(project, "year");
          const discipline = metadata(project, "discipline");
          return (
            <article className={"project-deck__card project-deck__card--" + palettes[index % palettes.length]} key={project.id}>
              <button type="button" className="project-deck__trigger" onClick={() => onOpenProject(project)} aria-label={"Abrir projecto " + project.title}>
                <span className="project-deck__index">0{index + 1}</span>
                <span className="project-deck__visual" aria-hidden="true"><i /><i /><i /></span>
                <span className="project-deck__meta">{[client, year].filter(Boolean).join(" · ")}</span>
                <strong>{project.title}</strong>
                <span className="project-deck__discipline">{discipline || "Projecto publicado"} <b aria-hidden="true">↗</b></span>
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
