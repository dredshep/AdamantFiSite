import Link from "next/link";

export default function DocumentationPage() {
  const handleClick = () => {
    // Handle the navigation back to the site
    window.history.back();
  };

  return (
    <div className="bg-tubeshapes-dark dark:bg-tubeshapes-light bg-cover min-h-screen flex flex-col justify-center items-center w-full">
      <div className="text-center p-8 max-w-2xl bg-adamant-app-box rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-white mb-4">
          Developer Documentation
        </h1>
        <p className="text-gray-400 mb-6">
          Access all the necessary documentation for developing on the AdamantFi
          platform.
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleClick}
            className="bg-adamant-box-buttonDark hover:bg-adamant-box-buttonLight text-white font-bold py-2 px-4 rounded transition-colors duration-300 flex-1"
          >
            Back to Site
          </button>
          <Link
            href="https://github.com/dredshep/AdamantFiSite/tree/main/docs"
            className="inline-block bg-adamant-gradientBright hover:bg-adamant-gradientDark text-white font-bold py-2 px-4 rounded transition-colors duration-300 flex-1"
            target="_blank"
            referrerPolicy="no-referrer"
          >
            Go to Documentation
          </Link>
        </div>
      </div>
    </div>
  );
}
