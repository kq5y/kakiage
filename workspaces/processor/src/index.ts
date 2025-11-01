import rehypeCodeTitles from "rehype-code-titles";
import rehypePrism from "rehype-prism-plus";
import rehypeSanitize from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeSanitize)
  .use(rehypeCodeTitles, { customClassName: "code-title" })
  .use(rehypePrism, { ignoreMissing: true })
  .use(rehypeStringify);

export async function markdownToHtml(markdown: string): Promise<string> {
  try {
    const file = await processor.process(markdown);
    return file.toString();
  } catch (_error) {
    throw new Error(`Error processing markdown`);
  }
}
