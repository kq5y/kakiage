import { pluginLineNumbers } from "@expressive-code/plugin-line-numbers";
import rehypeExpressiveCode from "rehype-expressive-code";
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
  .use(rehypeExpressiveCode, {
    themes: ["github-light"],
    plugins: [pluginLineNumbers()],
    shiki: {
      engine: "javascript",
    },
  })
  .use(rehypeStringify);

export async function markdownToHtml(markdown: string): Promise<string> {
  try {
    const file = await processor.process(markdown);
    return file.toString();
  } catch (_error) {
    throw new Error(`Error processing markdown`);
  }
}
