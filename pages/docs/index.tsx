import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { useState } from "react";
import { useRouter } from "next/router";
import { marked } from "marked";

type Docs = Array<{
  title: string;
  slug: string;
  content: string;
}>;

function getAllDocs(directory: string, basePath = "") {
  const files = fs.readdirSync(directory);
  const docs: Docs = files.map((file) => {
    const fullPath = path.join(directory, file);
    const fileStats = fs.statSync(fullPath);

    if (fileStats.isDirectory()) {
      return getAllDocs(fullPath, `${basePath}/${file}`);
    } else {
      const content = fs.readFileSync(fullPath, "utf8");
      const meta = matter(content);
      return {
        ...meta.data,
        slug: `${basePath}/${file.replace(/\.md$/, "")}`,
        content: meta.content,
      };
    }
  }) as Docs;
  return docs.flat();
}

export async function getStaticProps() {
  const docsDirectory = path.join(process.cwd(), "docs");
  const docs = getAllDocs(docsDirectory).filter((doc) => doc !== undefined);

  return {
    props: {
      docs,
    },
  };
}

export default function Documentation({ docs }: { docs: Docs }) {
  const [selectedDoc, setSelectedDoc] = useState<Docs["0"] | undefined>(
    docs[0]
  );
  const router = useRouter();

  const handleDocClick = (doc: Docs["0"]) => {
    setSelectedDoc(doc);
    const docPath = `/docs${doc.slug}`; // Ensure this path is correctly formed
    router.push(docPath, undefined, { shallow: true });
  };

  const getHtmlContent = (markdownContent: string) => {
    return { __html: marked(markdownContent) };
  };

  // Debugging: Log the docs array to see what we have
  console.log(docs);

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <div style={{ width: "20%", overflowY: "auto" }}>
        <ul className="p-4 flex flex-col gap-2">
          {docs.length > 0 ? (
            docs.map((doc) => (
              <li
                key={doc.slug}
                onClick={() => handleDocClick(doc)}
                className="bg-gray-200 hover:bg-gray-300 cursor-pointer p-2 rounded-md"
              >
                {doc.slug.split("/").pop()?.replace(/-/g, " ")}
              </li>
            ))
          ) : (
            <li>No documents found</li>
          )}
        </ul>
      </div>
      <div style={{ width: "80%", padding: "20px", overflowY: "auto" }}>
        {selectedDoc ? (
          <>
            <h1>{selectedDoc.title}</h1>
            <div
              dangerouslySetInnerHTML={getHtmlContent(selectedDoc.content)}
            />
          </>
        ) : (
          <h1>Select a document</h1>
        )}
      </div>
    </div>
  );
}
