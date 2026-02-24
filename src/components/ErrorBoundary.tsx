import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home, Copy, ChevronDown, ChevronUp } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackRoute?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
  copied: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
    copied: false,
  };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    const route = window.location.pathname;
    const timestamp = new Date().toISOString();
    const log = {
      timestamp,
      route,
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    };

    console.error(`[ErrorBoundary] Crash on ${route}:`, log);

    try {
      const prev = JSON.parse(localStorage.getItem("error_logs") || "[]");
      prev.unshift(log);
      localStorage.setItem("error_logs", JSON.stringify(prev.slice(0, 20)));
    } catch {}
  }

  handleReload = () => window.location.reload();

  handleHome = () => {
    window.location.href = "/";
  };

  handleCopy = () => {
    const { error, errorInfo } = this.state;
    const text = [
      `Rota: ${window.location.pathname}`,
      `Erro: ${error?.message}`,
      `Stack: ${error?.stack}`,
      `Component Stack: ${errorInfo?.componentStack}`,
    ].join("\n\n");
    navigator.clipboard.writeText(text).then(() => {
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const { error, showDetails, copied } = this.state;

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-lg w-full text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>

          <div className="space-y-2">
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
              Algo deu errado
            </h1>
            <p className="text-sm text-muted-foreground font-body leading-relaxed">
              Ocorreu um erro inesperado nesta página. Tente recarregar ou voltar ao início.
            </p>
            <p className="text-xs text-muted-foreground/50 font-mono">
              Rota: {window.location.pathname}
            </p>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={this.handleReload}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Recarregar
            </button>
            <button
              onClick={this.handleHome}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors"
            >
              <Home className="w-4 h-4" />
              Início
            </button>
          </div>

          <div className="pt-2">
            <button
              onClick={() => this.setState({ showDetails: !showDetails })}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
            >
              Detalhes técnicos
              {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {showDetails && (
              <div className="mt-3 text-left">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground/40">
                    Stack Trace
                  </span>
                  <button
                    onClick={this.handleCopy}
                    className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/50 hover:text-primary transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                    {copied ? "Copiado!" : "Copiar"}
                  </button>
                </div>
                <pre className="p-4 rounded-lg bg-muted/30 border border-border/30 text-[11px] font-mono text-muted-foreground overflow-auto max-h-48 whitespace-pre-wrap break-words">
                  {error?.message}
                  {"\n\n"}
                  {error?.stack}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
