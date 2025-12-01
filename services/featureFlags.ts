export const FeatureFlags = {
    ENABLE_IMAGE_GENERATION: false, // Set to false by default as per request to hide it
};

export const isFeatureEnabled = (flag: keyof typeof FeatureFlags): boolean => {
    if (typeof window !== 'undefined' && window.localStorage) {
        const override = window.localStorage.getItem(flag);
        if (override === 'true') return true;
        if (override === 'false') return false;
    }
    return FeatureFlags[flag];
};

// Console helper for the user
if (typeof window !== 'undefined') {
    // Log initial state
    const isEnabled = isFeatureEnabled('ENABLE_IMAGE_GENERATION');
    console.log(
        `%c 🔧 Feature Flag: Image Generation is ${isEnabled ? 'ENABLED' : 'DISABLED'}`,
        `color: ${isEnabled ? '#4ade80' : '#f87171'}; font-weight: bold; font-size: 12px; padding: 4px; border-radius: 4px; background: #1e293b;`
    );

    // Expose toggle function
    (window as any).toggleImageGeneration = (enable?: boolean) => {
        const current = localStorage.getItem('ENABLE_IMAGE_GENERATION') === 'true';
        const next = enable ?? !current;
        localStorage.setItem('ENABLE_IMAGE_GENERATION', String(next));

        console.log(
            `%c 🔧 Feature Flag: Image Generation set to ${next ? 'ENABLED' : 'DISABLED'}`,
            `color: ${next ? '#4ade80' : '#f87171'}; font-weight: bold; font-size: 12px; padding: 4px; border-radius: 4px; background: #1e293b;`
        );
        console.log('Please refresh the page for changes to take effect.');
        return next;
    };
}
