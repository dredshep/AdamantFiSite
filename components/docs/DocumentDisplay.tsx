import { marked } from "marked";
import MarkdownStyledLayout from "@/components/docs/MarkdownStyledLayout";
import { getHtmlContent, replaceLinkPlaceholders } from "@/utils/docs/docUtils";
import { useEffect, useState } from "react";

export type DocumentDisplayProps = {
  title?: string;
  content: string;
};

const DocumentDisplay = ({ title, content }: DocumentDisplayProps) => {
  const htmlContent = getHtmlContent(content);
  const [stateContent, setContent] = useState<string>("");
  useEffect(() => {
    if (typeof htmlContent === "string") {
      setContent(htmlContent);
    }
    // ensure it's Promise<string>
    if (typeof htmlContent === "object") {
      (
        htmlContent as unknown as {
          then: (arg0: (content: string) => void) => void;
        }
      ).then((content) => setContent(content));
    }
  }, [htmlContent]);
  const contentWithLinks = replaceLinkPlaceholders(stateContent);
  return (
    <MarkdownStyledLayout
      style={{ width: "80%", padding: "20px", overflowY: "auto" }}
    >
      <MarkdownStyledLayout key={title}>
        <h1>{title || "Untitled Document"}</h1>
        <MarkdownStyledLayout
          dangerouslySetInnerHTML={{ __html: contentWithLinks.join("") }}
        />
      </MarkdownStyledLayout>
    </MarkdownStyledLayout>
  );
};

export default DocumentDisplay;
