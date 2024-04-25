import styled from "styled-components";
import { Jura } from "next/font/google";
const jura = Jura({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
});

const MarkdownStyledLayout = styled.div`
  body {
    background-color: #0c0c20; /* very dark box color */
    color: #a78e5a; /* accent text color */
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    color: #ffffff; /* accent text color */
    font-weight: bold;
    font-family: ${jura.style.fontFamily};
  }
  /* font sizes per title */

  h1 {
    font-size: 2em;
    line-height: 2em;
  }

  h2 {
    font-size: 1.5em;
    line-height: 2em;
  }

  h3 {
    font-size: 1.17em;
    line-height: 2em;
  }

  h4 {
    font-size: 1em;
  }

  h5 {
    font-size: 0.83em;
  }

  h6 {
    font-size: 0.67em;
  }

  p {
    color: #ffffff; /* gradient dark color */
    line-height: 1.6;
  }

  a {
    color: #a68c57; /* gradient bright color */
    text-decoration: underline;
  }

  ul,
  ol {
    padding-left: 20px;
    color: #cfc5af; /* accent text color */
  }

  blockquote {
    border-left: 4px solid #30364e; /* box color */
    padding-left: 16px;
    color: #cacdda; /* button disabled color */
    background-color: #0b0b16; /* very dark box color */
    margin: 1em 0;
  }

  code {
    padding: 2px 4px;
    color: #bcc1d4; /* box color */
    border-radius: 4px;
  }

  pre {
    background-color: #242732; /* select trigger color */
    padding: 1em;
    overflow: auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th,
  td {
    border: 1px solid #30364e; /* box color */
    padding: 8px;
    text-align: left;
  }

  hr {
    border-top: 1px solid #30364e;
  }
`;

export default MarkdownStyledLayout;
