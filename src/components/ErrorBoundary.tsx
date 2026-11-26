import { Component, type ReactNode } from 'react';

export class ErrorBoundary extends Component<{ children: ReactNode }, { error?: Error }> {
  state: { error?: Error } = {};
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="mx-auto flex min-h-full max-w-[480px] flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="text-5xl" aria-hidden>🛠️</div>
        <h1 className="text-lg font-extrabold">앗, 문제가 생겼어요</h1>
        <p className="text-sm text-ink-sub">잠시 후 다시 시도해 주세요. 계속되면 아래 내용을 알려 주세요.</p>
        <code className="max-w-full break-words rounded-xl bg-white p-3 text-xs text-danger shadow-card">{this.state.error.message}</code>
        <button className="btn-3d" onClick={() => { this.setState({ error: undefined }); location.hash = '#/'; location.reload(); }}>홈으로 돌아가기</button>
      </div>
    );
  }
}
