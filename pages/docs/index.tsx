import MarkdownStyledLayout from "@/components/doc/MarkdownStyledLayout";

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
          <a href="./api/calls-and-responses/Azure%20API/Overview">
            Azure API Overview
          </a>
        </li>
        <li>
          <a href="./api/calls-and-responses/Azure%20API/Endpoint%20Detais">
            Endpoint Details
          </a>
        </li>
        <li>
          <a href="./api/calls-and-responses/Azure%20API/Response%20Interfaces">
            Response Interfaces
          </a>
        </li>
      </ul>
      <p>Explore other API resources:</p>
      <ul>
        <li>
          <a href="./api/calls-and-responses/24hr">24hr Volume</a>
        </li>
        <li>
          <a href="./api/calls-and-responses/config_mainnet.json">
            Config Mainnet
          </a>
        </li>
        <li>
          <a href="./api/calls-and-responses/rewards">Rewards</a>
        </li>
        <li>
          <a href="./api/calls-and-responses/secret_tokens">Secret Tokens</a>
        </li>
        <li>
          <a href="./api/calls-and-responses/sefi_comment.json">Sefi Comment</a>
        </li>
        <li>
          <a href="./api/calls-and-responses/tokens">Tokens</a>
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
          <a href="./SOP/Generating%20Typescript%20interfaces%20from%20JSON">
            Generating TypeScript Interfaces from JSON
          </a>
        </li>
        <li>
          <a href="./SOP/Setting%20up%20json-to-ts%20cli">
            Setting up JSON-to-TS CLI
          </a>
        </li>
      </ul>
      <h3 id="miscellaneous-resources">Miscellaneous Resources</h3>
      <ul>
        <li>
          <a href="./SecretSwap%20icons">SecretSwap Icons</a>
        </li>
      </ul>
      <h2 id="getting-started">Getting Started</h2>
      <p>
        To get started with our documentation, we recommend reading the{" "}
        <a href="./api/calls-and-responses/Azure%20API/Overview">
          Azure API Overview
        </a>{" "}
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
        <a href="mailto:support@adamantfi.com">support@adamantfi.com</a>. We are
        committed to continuously improving our documentation to better serve
        your needs.
      </p>
      <p>Thank you for choosing Adamant Finance. Happy exploring!</p>
    </MarkdownStyledLayout>
  );
}
