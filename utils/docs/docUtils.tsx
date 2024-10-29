// import path from "path";
// import matter from "gray-matter";
// import { marked } from "marked";
// import Link from "next/link";

// export type Doc = {
//   title: string;
//   slug: string;
//   content: string;
// };

// export type Docs = Doc[];

// // Set up a custom renderer
// const renderer = new marked.Renderer();

// const originalLinkRenderer = renderer.link.bind(renderer);
// renderer.link = (href, title, text) => {
//   if (href.startsWith("/")) {
//     // Use a placeholder that's unlikely to occur in normal text
//     return `@@LINK@@${href}@@${text}@@LINK@@`;
//   } else {
//     return originalLinkRenderer(href, title, text);
//   }
// };
// marked.setOptions({
//   renderer,
// });

// // Function to convert Markdown content to HTML
// export const getHtmlContent = (markdownContent: string) => ({
//   __html: marked(markdownContent),
// });

// // Recursively read all markdown files
// export function getAllDocs(
//   fs: typeof import("fs"),
//   directory: string,
//   basePath = ""
// ): Docs {
//   const files = fs.readdirSync(directory);
//   return files.flatMap((file) => {
//     const fullPath = path.join(directory, file);
//     const fileStats = fs.statSync(fullPath);

//     if (fileStats.isDirectory()) {
//       return getAllDocs(fs, fullPath, `${basePath}/${file}`);
//     } else {
//       const content = fs.readFileSync(fullPath, "utf8");
//       const meta = matter(content);
//       return [
//         {
//           ...meta.data,
//           slug: `${basePath}/${file.replace(/\.md$/, "").replace(/\s/g, " ")}`,
//           title: file.replace(/\.md$/, ""),
//           content: meta.content,
//         },
//       ];
//     }
//   });
// }
// //

// // Find a document by its slug
// export function getDocBySlug(
//   docs: Docs,
//   slug: string | string[] | undefined
// ): Doc | undefined {
//   if (slug === undefined) return undefined;
//   const slugPath = `/${Array.isArray(slug) ? slug.join("/") : slug}`;
//   return docs.find((doc) => doc.slug === slugPath);
// }
// // Replace placeholders with Link components in your React component
// export const replaceLinkPlaceholders = (htmlString: string) => {
//   const parts = htmlString.split("@@LINK@@");
//   const processed = parts.map((part, index) => {
//     if (index % 2 === 1) {
//       // Odd indices are link parts
//       const [href, text] = part.split("@@");
//       return (
//         <Link key={index} href={href}>
//           {text}
//         </Link>
//       );
//     }
//     return part;
//   });
//   return processed;
// };
