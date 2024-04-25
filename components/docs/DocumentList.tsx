import Link from "next/link";
import classNames from "classnames";

export type DocumentListProps = {
  docs: {
    slug: string;
    title?: string;
  }[];
  currentSlug: string;
};

const DocumentList = ({ docs, currentSlug }: DocumentListProps) => {
  console.log({ docs, currentSlug });
  return (
    <div style={{ width: "20%", overflowY: "auto" }}>
      <ul className="flex flex-col gap-2 p-4 bg-adamant-app-box min-h-screen text-white">
        {docs.map((doc) => (
          <Link key={doc.slug} href={`/docs${doc.slug}`}>
            <a
              className={classNames("p-2", {
                "bg-gray-800": doc.slug === currentSlug,
                "hover:bg-adamant-app-boxHighlight": doc.slug !== currentSlug,
                "cursor-pointer": true,
                "rounded-md": true,
              })}
            >
              {doc.title ||
                doc.slug.split("/").pop()?.replace(/-/g, " ") ||
                "Untitled"}
            </a>
          </Link>
        ))}
      </ul>
    </div>
  );
};

export default DocumentList;
