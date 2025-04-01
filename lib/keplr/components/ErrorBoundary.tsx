import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error, errorInfo: null };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to the console
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  override render(): ReactNode {
    const { hasError } = this.state;

    if (hasError === true) {
      // Fallback UI when an error occurs
      if (this.props.fallback !== undefined && this.props.fallback !== null) {
        return this.props.fallback;
      }

      return (
        <div className="p-6 bg-red-900 border border-red-700 rounded-lg text-white my-4">
          <h2 className="text-xl font-bold mb-4">Something went wrong</h2>
          <p className="mb-2">
            {this.state.error !== null && typeof this.state.error.message === 'string'
              ? this.state.error.message
              : 'An unknown error occurred'}
          </p>
          {this.state.error !== null &&
            typeof this.state.error.message === 'string' &&
            this.state.error.message.includes('NetworkError') && (
              <div className="mt-4 p-4 bg-yellow-900 bg-opacity-50 rounded">
                <h3 className="font-bold text-yellow-300 mb-2">Keplr Connection Issue</h3>
                <p>This appears to be a Keplr wallet connection error. Try the following:</p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-yellow-100">
                  <li>Ensure Keplr extension is installed and unlocked</li>
                  <li>Reload the page and try again</li>
                  <li>Check if you're connected to the correct network (testnet/mainnet)</li>
                  <li>The contract addresses might be incorrect for the current network</li>
                </ul>
              </div>
            )}
          <details className="mt-4">
            <summary className="cursor-pointer text-red-300">View error details</summary>
            <pre className="mt-2 whitespace-pre-wrap bg-black bg-opacity-30 p-4 rounded overflow-auto max-h-96 text-xs">
              {this.state.error !== null && this.state.error.toString()}
              {this.state.error !== null && this.state.error.stack !== undefined && (
                <>
                  {'\n\nStack Trace:\n'}
                  {this.state.error.stack}
                </>
              )}
            </pre>
          </details>
        </div>
      );
    }

    // When there's no error, render children normally
    return this.props.children;
  }
}

export default ErrorBoundary;
