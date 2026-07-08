import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Render de Markdown para las devoluciones. Estilos monocromáticos en `.markdown`
 * (ver globals.css). Los links abren en pestaña nueva.
 */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="markdown text-sm leading-relaxed text-ink/80">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ ...props }) => <a target="_blank" rel="noreferrer" {...props} />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
