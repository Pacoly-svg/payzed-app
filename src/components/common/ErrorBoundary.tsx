import React from 'react';

interface Props {
  children: React.ReactNode;
  fullScreen?: boolean;
}

/** Empêche un bug d'écran de faire planter toute l'application (écran blanc). */
export class ErrorBoundary extends React.Component<Props, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    // Message technique uniquement : jamais de données de compte dans les journaux
    console.error('[Payzed] erreur d’affichage :', error instanceof Error ? error.message : 'inconnue');
  }

  private reset = () => {
    if (this.props.fullScreen) {
      try {
        Object.keys(localStorage).filter((k) => k.startsWith('payzed_')).forEach((k) => localStorage.removeItem(k));
      } catch {
        // ignore
      }
      window.location.reload();
    } else {
      this.setState({ hasError: false });
    }
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className={`${this.props.fullScreen ? 'fixed inset-0 bg-white z-[200]' : 'py-16'} flex flex-col items-center justify-center gap-4 p-8 text-center`}>
        <p className="font-bold text-lg">Oups, un souci est survenu.</p>
        <button type="button" onClick={this.reset} className="px-6 py-3 rounded-full bg-black text-white font-bold text-sm">
          {this.props.fullScreen ? "Redémarrer l'application" : 'Réessayer'}
        </button>
      </div>
    );
  }
}
