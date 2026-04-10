/**
 * Next.js Instrumentation — runs once when the server starts.
 * Verifies that the Python background-removal API is reachable.
 * Docs: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        const apiUrl = process.env.NEXT_PUBLIC_BG_REMOVAL_API_URL || 'http://localhost:8000';
        const healthUrl = `${apiUrl}/health`;

        console.log('\n\x1b[36m[admin-web]\x1b[0m Checking background-removal API…');

        // Retry up to 6 times (30 seconds) — allows Python to finish starting
        let attempts = 0;
        const maxAttempts = 6;
        const intervalMs = 5000;

        const check = async (): Promise<void> => {
            try {
                const res = await fetch(healthUrl, { signal: AbortSignal.timeout(3000) });
                if (res.ok) {
                    console.log(`\x1b[32m[admin-web]\x1b[0m ✅  bg-removal API is UP at ${apiUrl}`);
                    return;
                }
                throw new Error(`HTTP ${res.status}`);
            } catch (err: any) {
                attempts++;
                if (attempts < maxAttempts) {
                    console.warn(`\x1b[33m[admin-web]\x1b[0m ⏳  bg-removal API not ready (attempt ${attempts}/${maxAttempts}), retrying in ${intervalMs / 1000}s…`);
                    await new Promise((r) => setTimeout(r, intervalMs));
                    return check();
                }
                console.error(`\x1b[31m[admin-web]\x1b[0m ⚠️  bg-removal API unreachable at ${healthUrl}. Image background removal will be unavailable.`);
            }
        };

        // Don't block server startup — run health check in background
        check();
    }
}
