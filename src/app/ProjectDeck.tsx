import { useState } from "react";
import type { KnowledgeEntry } from "../knowledge/schema";

interface ProjectDeckProps {
  projects: KnowledgeEntry[];
}

function metadata(project: KnowledgeEntry, key: string): string {
  const value = project.metadata[key];
  return typeof value === "string" || typeof value === "number" ? String(value) : "";
}

function ProjectPanel({ project, index }: { project: KnowledgeEntry; index: number }) {
  const [open, setOpen] = useState(false);
  const client = metadata(project, "client");
  const year = metadata(project, "year");
  const discipline = metadata(project, "discipline");
  const palettes = ["violet", "cyan", "blue", "rose"];
  return (
    <article className={"project-deck__card project-deck__card--" + palettes[index % palettes.length] + (open ? " is-open" : "")}>
      <button type="button" className="project-deck__trigger" onClick={() => setOpen((current) => !current)} aria-expanded={open}>
        <span className="project-deck__index">0{index + 1}</span>
        <span className="project-deck__visual" aria-hidden="true"><i /><i /><i /></span>
        <span className="project-deck__meta">{[client, year].filter(Boolean).join(" · ")}</span>
        <strong>{project.title}</strong>
        <span className="project-deck__discipline">{discipline || "Projecto publicado"} <b aria-hidden="true">{open ? "−" : "+"}</b></span>
      </button>
      {open ? (
        <div className="project-deck__detail">
          <p>{project.content}</p>
          <span>Este estudo de caso está a ser apresentado dentro do JARVIS, com base no catálogo público verificado.</span>
        </div>
      ) : null}
    </article>
  );
}

export function ProjectDeck({ projects }: ProjectDeckProps) {
  return (
    <section className="project-deck" aria-label="Projectos apresentados pelo JARVIS">
      <div className="project-deck__heading"><span>WORK / SELECTED</span><small>Explorar sem sair da conversa</small></div>
      <div className="project-deck__grid">
        {projects.slice(0, 4).map((project, index) => <ProjectPanel key={project.id} project={project} index={index} />)}
      </div>
    </section>
  );
}
