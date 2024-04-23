import { marked } from "marked";
import MarkdownStyledLayout from "@/components/doc/MarkdownStyledLayout";

export type DocumentDisplayProps = {
  title?: string;
  content: string;
};

const DocumentDisplay = ({ title, content }: DocumentDisplayProps) => {
  const getHtmlContent = (markdownContent: string) => ({
    __html: marked(markdownContent),
  });

  return (
    <MarkdownStyledLayout
      style={{ width: "80%", padding: "20px", overflowY: "auto" }}
    >
      <MarkdownStyledLayout key={title}>
        <h1>{title || "Untitled Document"}</h1>
        <MarkdownStyledLayout
          dangerouslySetInnerHTML={getHtmlContent(content)}
        />
      </MarkdownStyledLayout>
    </MarkdownStyledLayout>
  );
};

export default DocumentDisplay;
