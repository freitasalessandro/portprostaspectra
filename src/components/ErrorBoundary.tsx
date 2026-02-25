import { Component, type ErrorInfo, type ReactNode } from "react";
import { RefreshCw, AlertTriangle, Copy } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorId: string;
  errorMessage: string;
  copied: boolean;
}

const generateErrorId = () =>
  `ERR-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorId: "", errorMessage: "", copied: false };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      errorId: generateErrorId(),
      errorMessage: error?.message || "Erro desconhecido",
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[ErrorBoundary] ${this.state.errorId}:`, error, info.componentStack);
  }

  handleReload = () => {
    this.setState({ hasError: false, errorId: "", errorMessage: "", copied: false });
    window.location.reload();
  };

  handleRetry = () => {
    this.setState({ hasError: false, errorId: "", errorMessage: "", copied: false });
  };

  handleCopy = () => {
    const text = `ID: ${this.state.errorId}\nErro: ${this.state.errorMessage}`;
    navigator.clipboard.writeText(text).then(() => {
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="mx-auto w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-7 h-7 text-destructive" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-bold text-foreground">Algo deu errado</h1>
              <p className="text-sm text-muted-foreground">
                Ocorreu um erro inesperado. Tente recarregar a página.
              </p>
            </div>

            <div className="bg-muted/30 border border-border/40 rounded-lg p-4 text-left space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-mono">{this.state.errorId}</span>
                <button
                  onClick={this.handleCopy}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                >
                  <Copy className="w-3 h-3" />
                  {this.state.copied ? "Copiado!" : "Copiar"}
                </button>
              </div>
              <p className="text-xs text-muted-foreground/70 truncate">{this.state.errorMessage}</p>
            </div>

            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="px-5 py-2.5 text-sm font-medium border border-border/40 rounded-lg text-foreground hover:bg-muted/50 transition-colors"
              >
                Tentar novamente
              </button>
              <button
                onClick={this.handleReload}
                className="px-5 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Recarregar
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
