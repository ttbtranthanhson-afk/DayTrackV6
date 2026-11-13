import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary — bắt mọi lỗi render trong cây component bên dưới.
 * Nếu không có, 1 lỗi nhỏ (vd undefined.toUpperCase trong initials) sẽ
 * làm trắng toàn màn hình mà người dùng không thể khôi phục.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Log để debug — không gửi message chi tiết ra ngoài
    console.error('[DayTrack] Render error:', error.message, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h1 className="text-lg font-bold text-gray-800 mb-2">
            Đã xảy ra lỗi không mong muốn
          </h1>
          <p className="text-sm text-gray-500 mb-6 max-w-xs">
            Ứng dụng gặp sự cố khi hiển thị trang này. Thử tải lại để khôi phục.
          </p>
          <button
            onClick={this.handleReset}
            className="px-5 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-semibold active:scale-95 transition-transform"
          >
            Thử lại
          </button>
          <button
            onClick={() => { localStorage.clear(); window.location.reload(); }}
            className="mt-3 px-5 py-2 text-xs text-gray-400 underline"
          >
            Xóa dữ liệu và tải lại
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
