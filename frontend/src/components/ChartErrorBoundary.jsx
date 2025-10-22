import React from 'react'

class ChartErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.warn('Chart rendering error caught:', error, errorInfo)
  }

  componentDidUpdate(prevProps) {
    // Reset error state when chartType changes
    if (this.state.hasError && prevProps.chartType !== this.props.chartType) {
      this.setState({ hasError: false, error: null })
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full text-dark-textGray">
          <div className="text-center">
            <p>Diagramm wird geladen...</p>
            <button 
              onClick={() => this.setState({ hasError: false, error: null })}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Neu laden
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ChartErrorBoundary

