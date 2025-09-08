import DualSetupExample from '@/components/app/Shared/ViewingKeys/DualSetupExample';
import Head from 'next/head';

/**
 * Test page for the dual viewing key setup system
 * Access at: http://localhost:3000/viewing-key-test
 */
export default function ViewingKeyTestPage() {
  return (
    <>
      <Head>
        <title>Viewing Key Test - Dual Setup System</title>
        <meta name="description" content="Test the dual viewing key setup system" />
      </Head>

      <div className="min-h-screen bg-adamant-app-background">
        <div className="container mx-auto py-8">
          <DualSetupExample />
        </div>
      </div>
    </>
  );
}
