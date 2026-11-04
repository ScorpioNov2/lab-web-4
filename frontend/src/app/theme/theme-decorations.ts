export interface ThemeDecorations {
	corners: string[];
	lines: string[];
	slots: string[];
}

/**
 * Decorative elements injected around the page for each event theme. The pictures themselves are
 * configured by CSS variables in src/styles/themes/_<theme>.scss.
 */
export const THEME_DECORATIONS: Record<string, ThemeDecorations> = {
	halloween: {
		corners: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
		lines: ['top', 'bottom', 'left', 'right'],
		slots: [
			'top-1',
			'top-2',
			'top-3',
			'top-4',
			'left-1',
			'left-2',
			'left-3',
			'right-1',
			'right-2',
			'right-3',
			'bottom-1',
			'bottom-2',
			'bottom-3',
			'bottom-4',
		],
	},
	christmas: {
		corners: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
		lines: ['top', 'bottom', 'left', 'right'],
		slots: ['left-1', 'right-1'],
	},
};
