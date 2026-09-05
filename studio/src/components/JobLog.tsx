import {useEffect, useRef} from "react";
import type {JobLine} from "../api";

export const LogView = ({lines, className}: {lines: JobLine[]; className?: string}) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines.length]);
  return (
    <div ref={ref} className={`log ${className ?? ""}`}>
      {lines.length === 0 ? <span className="muted">Waiting for output…</span> : null}
      {lines.map((l, i) => (
        <div key={i} className={l.stream === "stderr" ? "err" : l.line.startsWith("$ ") ? "cmd" : undefined}>
          {l.line}
        </div>
      ))}
    </div>
  );
};
