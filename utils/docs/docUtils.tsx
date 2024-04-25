import path from "path";
import matter from "gray-matter";
import { marked } from "marked";

export type Doc = {
  title: string;
  slug: string;
  content: string;
};

export type Docs = Doc[];

// Recursively read all markdown files
export function getAllDocs(
  fs: typeof import("fs"),
  directory: string,
  basePath = ""
): Docs {
  const files = fs.readdirSync(directory);
  return files.flatMap((file) => {
    const fullPath = path.join(directory, file);
    const fileStats = fs.statSync(fullPath);

    if (fileStats.isDirectory()) {
      return getAllDocs(fs, fullPath, `${basePath}/${file}`);
    } else {
      const content = fs.readFileSync(fullPath, "utf8");
      const meta = matter(content);
      return [
        {
          ...meta.data,
          slug: `${basePath}/${file.replace(/\.md$/, "").replace(/\s/g, " ")}`,
          title: file.replace(/\.md$/, ""),
          content: meta.content,
        },
      ];
    }
  });
}
//

// Find a document by its slug
export function getDocBySlug(
  docs: Docs,
  slug: string | string[] | undefined
): Doc | undefined {
  if (!slug) return undefined;
  const slugPath = `/${Array.isArray(slug) ? slug.join("/") : slug}`;
  return docs.find((doc) => doc.slug === slugPath);
}

// Function to convert Markdown content to HTML
export const getHtmlContent = (markdownContent: string) => ({
  __html: marked(markdownContent),
});
