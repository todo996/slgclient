import { ResolutionPolicy, sys, view } from 'cc';

const DESIGN_WIDTH = 1280;
const DESIGN_HEIGHT = 720;
const DESIGN_RATIO = DESIGN_WIDTH / DESIGN_HEIGHT;

let initialized = false;
let resizeTimer: number | null = null;

function viewportSize(): { width: number; height: number } {
    if (typeof window === 'undefined') {
        return { width: DESIGN_WIDTH, height: DESIGN_HEIGHT };
    }

    return {
        width: Math.max(1, window.visualViewport?.width ?? window.innerWidth),
        height: Math.max(1, window.visualViewport?.height ?? window.innerHeight),
    };
}

function resizeGame(): void {
    const { width, height } = viewportSize();
    const ratio = width / height;

    // Màn hình ngang rộng hơn thiết kế sẽ giữ nguyên chiều cao và mở rộng hai bên.
    // Màn hình hẹp hoặc đang xoay dọc dùng SHOW_ALL để toàn bộ giao diện vẫn nhìn thấy.
    const policy = ratio >= DESIGN_RATIO
        ? ResolutionPolicy.FIXED_HEIGHT
        : ResolutionPolicy.SHOW_ALL;

    view.resizeWithBrowserSize(true);
    view.setDesignResolutionSize(DESIGN_WIDTH, DESIGN_HEIGHT, policy);
}

function scheduleResize(): void {
    if (typeof window === 'undefined') {
        return;
    }

    if (resizeTimer !== null) {
        window.clearTimeout(resizeTimer);
    }
    resizeTimer = window.setTimeout(() => {
        resizeTimer = null;
        resizeGame();
    }, 120);
}

/**
 * Bật chế độ responsive cho bản Web/PWA. Hàm chỉ khởi tạo một lần trong suốt
 * vòng đời ứng dụng và tự cập nhật khi đổi hướng, mở bàn phím hoặc thanh Safari thay đổi.
 */
export function initMobileSupport(): void {
    if (initialized || !sys.isBrowser || typeof window === 'undefined') {
        return;
    }

    initialized = true;
    resizeGame();

    window.addEventListener('resize', scheduleResize, { passive: true });
    window.addEventListener('orientationchange', scheduleResize, { passive: true });
    window.visualViewport?.addEventListener('resize', scheduleResize, { passive: true });
}
