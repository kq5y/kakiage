import "prism-themes/themes/prism-ghcolors.css";

import "@/assets/article.scss";

interface ArticleProps {
  value: string;
  className?: string;
}

export default function Article({ value, className }: ArticleProps) {
  return (
    /** biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized */
    <div className={`article ${className || ""}`} dangerouslySetInnerHTML={{ __html: value }} />
  );
}
