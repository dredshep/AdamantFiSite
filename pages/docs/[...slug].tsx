import { useRouter } from "next/router";
import { useEffect } from "react";
import DocumentList from "@/components/doc/DocumentList";
import DocumentDisplay from "@/components/doc/DocumentDisplay";
import { Docs, Doc, getAllDocs, getDocBySlug } from "@/utils/docs/docUtils"; // Ensure these imports are correct
import fs from "fs";
import path from "path";

export async function getStaticProps() {
  const docsDirectory = path.join(process.cwd(), "docs");
  const docs = getAllDocs(fs, docsDirectory).filter((doc) => doc !== undefined);
  return { props: { docs } };
}

export async function getStaticPaths() {
  const docsDirectory = path.join(process.cwd(), "docs");
  const docs = getAllDocs(fs, docsDirectory).filter((doc) => doc !== undefined);
  const paths = docs.map((doc) => ({
    params: { slug: doc.slug.split("/").filter(Boolean) },
  }));
  return { paths, fallback: false };
}

export default function DocPage({ docs }: { docs: Docs }) {
  const router = useRouter();
  const { slug } = router.query;

  const documentSlug = decodeURIComponent(
    Array.isArray(slug) ? slug.join("/") : slug || ""
  );
  const selectedDoc = getDocBySlug(docs, documentSlug);

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
      <DocumentList docs={docs} currentSlug={documentSlug} />
      {selectedDoc ? (
        <DocumentDisplay
          title={selectedDoc.title}
          content={selectedDoc.content}
        />
      ) : (
        <h1>Document not found</h1>
      )}
    </div>
  );
}
