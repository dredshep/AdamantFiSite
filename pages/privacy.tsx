import { ArrowLeft } from 'lucide-react';
import { GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import React from 'react';

const PrivacyPolicy: React.FC = () => {
  return (
    <>
      <Head>
        <title>Privacy Policy - AdamantFi</title>
        <meta
          name="description"
          content="AdamantFi Privacy Policy - Learn how we protect your privacy while using our decentralized exchange."
        />
      </Head>

      <div className="min-h-screen bg-adamant-background">
        <div className="max-w-4xl mx-auto px-4 py-12">
          {/* Navigation */}
          <div className="mb-6">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="flex items-center gap-2 text-adamant-text-secondary hover:text-adamant-accentText transition-colors duration-200 group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:translate-x-[-2px] transition-transform duration-200" />
                <span>Back to AdamantFi</span>
              </Link>
              {/* <span className="text-adamant-text-secondary/30">•</span>
              <Link
                href="/"
                className="flex items-center gap-2 text-adamant-text-secondary/60 hover:text-adamant-accentText transition-colors duration-200"
              >
                <Home className="w-4 h-4" />
                <span>Home</span>
              </Link> */}
            </div>
          </div>

          <div className="bg-adamant-box-background border border-adamant-box-border rounded-lg p-8">
            <h1 className="text-3xl font-bold text-adamant-text-primary mb-8">Privacy Policy</h1>

            <div className="prose prose-invert max-w-none">
              <p className="text-adamant-text-secondary mb-6">
                <strong>Effective Date:</strong> August 20, 2025
              </p>

              <div className="space-y-6 text-adamant-text-secondary leading-relaxed">
                <p>
                  AdamantWare is the core development team behind the open-source decentralized
                  application and decentralized exchange known as AdamantFi (the "Application" or
                  the "Service"). The Application, including its frontend interface, is provided as
                  open-source software and is intended for use "as is", without cost.
                </p>

                <h2 className="text-xl font-semibold text-adamant-text-primary mt-8 mb-4">
                  Information Collection and Use
                </h2>

                <p>
                  We respect your privacy. The Application is designed to operate without requiring
                  the collection of any personal information. Specifically:
                </p>

                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>
                    We do not collect, store, or process any information that may directly or
                    indirectly identify you.
                  </li>
                  <li>
                    We do not have access to your wallet, private keys, or transaction history.
                  </li>
                  <li>
                    We do not log your IP address, device type, operating system, browser, or
                    language preferences.
                  </li>
                  <li>We do not use cookies or tracking technologies.</li>
                </ul>

                <p>
                  All interactions within the Application occur directly between you and the
                  blockchain. Any data visible through the Application (e.g., balances,
                  transactions, smart contract interactions) is publicly available on the blockchain
                  and not collected or stored by AdamantWare.
                </p>

                <h2 className="text-xl font-semibold text-adamant-text-primary mt-8 mb-4">
                  Third-Party Services
                </h2>

                <p>
                  The Application may enable interaction with decentralized protocols, third-party
                  smart contracts, or blockchain networks. AdamantWare has no control over, and
                  assumes no responsibility for, the content, privacy policies, or practices of any
                  third-party services you may choose to interact with through the Application.
                </p>

                <h2 className="text-xl font-semibold text-adamant-text-primary mt-8 mb-4">
                  Disclaimer
                </h2>

                <p>
                  Since AdamantFi is open-source software, it may be used, modified, or hosted by
                  other parties. AdamantWare does not control or guarantee how third parties may
                  deploy or operate instances of the Application. When using AdamantFi through a
                  third-party deployment, please review the privacy policy and terms of such third
                  party.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export const getStaticProps: GetStaticProps = () => {
  return {
    props: {},
  };
};

export default PrivacyPolicy;
