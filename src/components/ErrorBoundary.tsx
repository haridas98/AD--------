import React, { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="error-boundary">
            <h2>Something went wrong</h2>
            <p>We're sorry, but an unexpected error occurred.</p>
            {this.state.error && (
              <pre
                style={{
                  background: '#f5f5f5',
                  padding: '1rem',
                  borderRadius: '8px',
                  overflow: 'auto',
                  fontSize: '0.85rem',
                  marginTop: '1rem',
                }}
              >
                {this.state.error.message}
              </pre>
            )}
            <button
              className="btn-primary"
              style={{ marginTop: '1rem' }}
              onClick={() => window.location.reload()}
            >
              Reload page
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
