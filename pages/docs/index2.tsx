import MarkdownStyledLayout from "@/components/docs/MarkdownStyledLayout";
import Link from "next/link";

export default function DocPage() {
  return (
    <MarkdownStyledLayout>
      <h1 id="welcome-to-adamant-finance-documentation">
        Welcome to Adamant Finance Documentation
      </h1>
      <p>
        Welcome to the central hub for all Adamant Finance technical
        documentation. Whether you are a developer, a stakeholder, or just
        curious about the inner workings of Adamant Finance, you&#39;ll find
        detailed documentation on our APIs, implementation procedures, and more.
      </p>
      <h2 id="what-you-will-find-here">What You Will Find Here</h2>
      <h3 id="api-documentation">API Documentation</h3>
      <p>
        Dive into the specifics of our API, exploring endpoints, responses, and
        detailed use cases. Our API documentation is structured to give you
        insights into how to integrate and utilize our systems efficiently.
      </p>
      <ul>
        <li>
          <Link href="./docs/api/calls-and-responses/Azure%20API/Overview">
            Azure API Overview
          </Link>
        </li>
        <li>
          <Link href="./docs/api/calls-and-responses/Azure%20API/Endpoint%20Detais">
            Endpoint Details
          </Link>
        </li>
        <li>
          <Link href="./docs/api/calls-and-responses/Azure%20API/Response%20Interfaces">
            Response Interfaces
          </Link>
        </li>
      </ul>
      <p>Explore other API resources:</p>
      <ul>
        <li>
          <Link href="./docs/api/calls-and-responses/24hr">24hr Volume</Link>
        </li>
        <li>
          <Link href="./docs/api/calls-and-responses/config_mainnet.json">
            Config Mainnet
          </Link>
        </li>
        <li>
          <Link href="./docs/api/calls-and-responses/rewards">Rewards</Link>
        </li>
        <li>
          <Link href="./docs/api/calls-and-responses/secret_tokens">
            Secret Tokens
          </Link>
        </li>
        <li>
          <Link href="./docs/api/calls-and-responses/sefi_comment.json">
            Sefi Comment
          </Link>
        </li>
        <li>
          <Link href="./docs/api/calls-and-responses/tokens">Tokens</Link>
        </li>
      </ul>
      <h3 id="standard-operating-procedures-sop-">
        Standard Operating Procedures (SOP)
      </h3>
      <p>
        For those looking to understand our operational frameworks and
        procedures:
      </p>
      <ul>
        <li>
          <Link href="./docs/SOP/Generating%20Typescript%20interfaces%20from%20JSON">
            Generating TypeScript Interfaces from JSON
          </Link>
        </li>
        <li>
          <Link href="./docs/SOP/Setting%20up%20json-to-ts%20cli">
            Setting up JSON-to-TS CLI
          </Link>
        </li>
      </ul>
      <h3 id="miscellaneous-resources">Miscellaneous Resources</h3>
      <ul>
        <li>
          <Link href="./docs/SecretSwap%20icons">SecretSwap Icons</Link>
        </li>
      </ul>
      <h2 id="getting-started">Getting Started</h2>
      <p>
        To get started with our documentation, we recommend reading the{" "}
        <Link href="./docs/api/calls-and-responses/Azure%20API/Overview">
          Azure API Overview
        </Link>{" "}
        as it provides a comprehensive introduction to the capabilities and
        design of our financial APIs.
      </p>
      <p>
        Feel free to navigate through the sections using the links provided in
        each document. Each section is designed to be standalone, allowing you
        to jump directly to the information you need.
      </p>
      <h2 id="feedback">Feedback</h2>
      <p>
        Your feedback is important to us. If you have comments or questions,
        please feel free to reach out to us at{" "}
        <Link href="mailto:support@adamantfi.com">support@adamantfi.com</Link>.
        We are committed to continuously improving our documentation to better
        serve your needs.
      </p>
      <p>Thank you for choosing Adamant Finance. Happy exploring!</p>
    </MarkdownStyledLayout>
  );
}
