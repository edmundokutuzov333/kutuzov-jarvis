import type { KnowledgeEntry } from "../knowledge/schema";

interface ProjectWindowProps {
  project: KnowledgeEntry;
}

function metadata(project: KnowledgeEntry, key: string): string {
  const value = project.metadata[key];
  return typeof value === "string" || typeof value === "number" ? String(value) : "";
}

export function ProjectWindow({ project }: ProjectWindowProps) {
  const client = metadata(project, "client");
  const year = metadata(project, "year");
  const discipline = metadata(project, "discipline");
  return (
    <article className="project-window">
      <div className="project-window__visual" aria-hidden="true">
        <span className="project-window__visual-grid" />
        <span className="project-window__visual-orbit project-window__visual-orbit--one" />
        <span className="project-window__visual-orbit project-window__visual-orbit--two" />
        <span className="project-window__visual-core" />
      </div>
      <div className="project-window__body">
        <p className="project-window__eyebrow">WORK / SELECTED</p>
        <h2>{project.title}</h2>
        <p className="project-window__meta">{[client, year, discipline].filter(Boolean).join(" · ")}</p>
        <div className="project-window__rule" />
        <p className="project-window__description">{project.content}</p>
        <div className="project-window__footer">
          <span>CATALOGUE PUBLIC / VERIFIED</span>
          <span>JARVIS VIEWPORT</span>
        </div>
      </div>
    </article>
  );
}
