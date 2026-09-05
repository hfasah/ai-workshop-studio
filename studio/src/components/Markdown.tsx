import {useMemo} from "react";
import {marked} from "marked";

marked.setOptions({gfm: true, breaks: true});

// Files under episodes/ are written by the crew or by Hippolyte; they are trusted local content.
export const Markdown = ({source}: {source: string}) => {
  const html = useMemo(() => marked.parse(source, {async: false}) as string, [source]);
  return <div className="md" dangerouslySetInnerHTML={{__html: html}} />;
};

export const Doc = ({name, content, open}: {name: string; content: string; open?: boolean}) => (
  <details className="doc" open={open}>
    <summary>{name}</summary>
    <div className="body">{name.endsWith(".csv") ? <pre className="mono">{content}</pre> : <Markdown source={content} />}</div>
  </details>
);
