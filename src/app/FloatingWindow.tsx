import { useRef, useState, type PointerEvent, type ReactNode } from "react";

interface Props {
  id: string;
  title: string;
  initialClass: string;
  zIndex: number;
  onFocus: () => void;
  onClose: () => void;
  children: ReactNode;
}
interface DragState { pointerX: number; pointerY: number; offsetX: number; offsetY: number; }

export function FloatingWindow({ id, title, initialClass, zIndex, onFocus, onClose, children }: Props) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const drag = useRef<DragState | null>(null);

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest("button")) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    drag.current = { pointerX: event.clientX, pointerY: event.clientY, offsetX: offset.x, offsetY: offset.y };
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
    onFocus();
  }
  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!drag.current) return;
    setOffset({ x: drag.current.offsetX + event.clientX - drag.current.pointerX, y: drag.current.offsetY + event.clientY - drag.current.pointerY });
  }
  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    drag.current = null;
    setDragging(false);
  }

  return (
    <section className={"floating-window " + initialClass + (dragging ? " is-dragging" : "")} data-window-id={id} style={{ zIndex, transform: "translate3d(" + offset.x + "px, " + offset.y + "px, 0)" }} onPointerDown={onFocus}>
      <div className="floating-window__bar" aria-label={"Mover janela " + title} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp}>
        <div className="window-controls" aria-hidden="true"><span /><span /><span /></div>
        <div className="floating-window__heading"><strong>{title}</strong></div>
        <button className="floating-window__close" type="button" aria-label={"Fechar " + title} onClick={onClose}>×</button>
      </div>
      <div className="floating-window__content">{children}</div>
    </section>
  );
}
