// pages/docs/[[...slug]].js
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { marked } from "marked";
import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head";
import classNames from "classnames";
import MarkdownStyledLayout from "@/components/doc/MarkdownStyledLayout";
import { useEffect } from "react";

type Doc = {
  title: string;
  slug: string;
  content: string;
};

type Docs = Doc[];

// Helper function to recursively read all markdown files
function getAllDocs(directory: string, basePath = ""): Docs {
  const files = fs.readdirSync(directory);
  return files.flatMap((file) => {
    const fullPath = path.join(directory, file);
    const fileStats = fs.statSync(fullPath);

    if (fileStats.isDirectory()) {
      return getAllDocs(fullPath, `${basePath}/${file}`);
    } else {
      const content = fs.readFileSync(fullPath, "utf8");
      const meta = matter(content); // When you generate `slug` make sure it's not double-encoded
      return {
        ...meta.data,
        slug: `${basePath}/${file.replace(/\.md$/, "").replace(/\s/g, " ")}`, // Ensure spaces are encoded properly
        title: file.replace(/\.md$/, ""),
        content: meta.content,
      };
    }
  }) as Docs;
}

function getDocBySlug(
  docs: Docs,
  slug: string | string[] | undefined
): Doc | undefined {
  if (!slug) return undefined;
  // Normalize the slug to ensure it starts with a leading slash for consistent matching
  const slugPath = `/${Array.isArray(slug) ? slug.join("/") : slug}`;
  console.log({
    slugPath,
    slugs: docs.map((doc) => doc.slug),
  });
  return docs.find((doc) => doc.slug === slugPath);
}

export async function getStaticProps() {
  const docsDirectory = path.join(process.cwd(), "docs");
  const docs = getAllDocs(docsDirectory).filter((doc) => doc !== undefined);
  return { props: { docs } };
}

export async function getStaticPaths() {
  const docsDirectory = path.join(process.cwd(), "docs");
  const docs = getAllDocs(docsDirectory).filter((doc) => doc !== undefined);
  const paths = docs.map((doc) => ({
    params: {
      slug: doc.slug
        .split("/")
        .map((segment) => segment)
        .filter(Boolean),
    },
  }));
  return { paths, fallback: false };
}

export default function DocPage({ docs }: { docs: Docs }) {
  const router = useRouter();
  const { slug } = router.query; // `slug` can be string or array of strings

  const documentSlug = decodeURIComponent(
    Array.isArray(slug) ? slug.join("/") : slug || ""
  );
  // console.log({
  //   encodedSlug: encodeURIComponent(documentSlug || ""),
  //   rawSlug: documentSlug,
  //   decodedSlug: decodeURIComponent(documentSlug || ""),
  //   docsSlugs: docs.map((doc) => doc.slug),
  // });

  const selectedDoc = getDocBySlug(docs, documentSlug);
  // console.log({ slug, selectedDoc });
  const getHtmlContent = (markdownContent: string) => ({
    __html: marked(markdownContent),
  });
  const handleDocClick = (doc: Doc) => {
    const docPath = `/docs${doc.slug}`; // Ensure this path does not get encoded twice
    router.push(docPath);
  };

  // if no doc, log 404 404 404 like 15 times lol

  useEffect(() => {
    if (!selectedDoc) {
      console.error("Document not found");
    }
  }, [selectedDoc]);

  return (
    <div
      style={{ display: "flex", height: "100vh" }}
      className="bg-black text-white"
    >
      {/* <Head>
        <title>
          {selectedDoc?.title.toString()
            ? `${selectedDoc.title.toString()} - `
            : ""}
          AdamantFi Docs
        </title>
      </Head> */}
      <div style={{ width: "20%", overflowY: "auto" }}>
        <ul className="flex flex-col gap-2 p-4 bg-adamant-app-box min-h-screen text-white">
          {docs.map((doc) => (
            <Link key={doc.slug} href={`/docs${doc.slug}`}>
              {" "}
              <li
                // style={{
                //   cursor: "pointer",
                //   color: doc.slug === documentSlug ? "blue" : "black",
                // }}
                className={classNames("p-2", {
                  "bg-gray-800": doc.slug === documentSlug,
                  "hover:bg-adamant-app-boxHighlight":
                    doc.slug !== documentSlug,
                  "cursor-pointer": true,
                  "rounded-md": true,
                })}
                onClick={() => handleDocClick(doc)}
              >
                {doc.title ||
                  doc.slug.split("/").pop()?.replace(/-/g, " ") ||
                  "Untitled"}
              </li>
            </Link>
          ))}
        </ul>
      </div>
      <div style={{ width: "80%", padding: "20px", overflowY: "auto" }}>
        {selectedDoc ? (
          <MarkdownStyledLayout>
            <h1>
              {selectedDoc.title ||
                selectedDoc.slug.split("/").pop()?.replace(/-/g, " ")}
            </h1>
            <div
              dangerouslySetInnerHTML={getHtmlContent(selectedDoc.content)}
            />
          </MarkdownStyledLayout>
        ) : (
          <h1>Document not found</h1>
        )}
      </div>
    </div>
  );
}
