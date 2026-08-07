import { Color } from 'cc';

/**
 * Design token dùng chung cho giao diện Tam Quốc hiện đại.
 * Không chứa dữ liệu gameplay và không thay thế sprite tướng/bản đồ.
 */
export const GameTheme = Object.freeze({
    colors: Object.freeze({
        ink950: new Color(12, 11, 10, 255),
        ink900: new Color(24, 21, 18, 255),
        ink800: new Color(38, 31, 25, 255),
        bronze700: new Color(111, 73, 34, 255),
        bronze500: new Color(174, 120, 57, 255),
        gold500: new Color(218, 170, 80, 255),
        gold300: new Color(244, 214, 151, 255),
        ivory: new Color(240, 228, 201, 255),
        muted: new Color(177, 164, 142, 255),
        jade700: new Color(24, 88, 80, 255),
        jade500: new Color(53, 133, 112, 255),
        success: new Color(121, 184, 78, 255),
        danger: new Color(154, 55, 49, 255),
        warning: new Color(214, 151, 54, 255),
        disabled: new Color(83, 79, 72, 255),
        transparent: new Color(0, 0, 0, 0),
    }),
    typography: Object.freeze({
        bodyFont: 'Arial',
        titleFont: 'Times New Roman',
        titleMinSize: 28,
        bodyMinSize: 16,
        buttonMinSize: 18,
    }),
    spacing: Object.freeze({
        xs: 4,
        sm: 8,
        md: 12,
        lg: 16,
        xl: 24,
        xxl: 32,
    }),
    radius: Object.freeze({
        small: 6,
        medium: 10,
        large: 16,
    }),
    motion: Object.freeze({
        fast: 0.12,
        normal: 0.2,
        slow: 0.35,
    }),
});

export type GameThemeTokens = typeof GameTheme;
