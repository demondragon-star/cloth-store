export default function UnauthorizedPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark-50 via-white to-primary-50/30 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full text-center space-y-8 animate-slide-up">
                <div className="mx-auto w-20 h-20 bg-red-50 rounded-2xl ring-1 ring-red-100 flex items-center justify-center">
                    <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v.01M12 9v2m0 8a9 9 0 110-18 9 9 0 010 18z" />
                    </svg>
                </div>
                <div>
                    <h2 className="text-3xl font-extrabold tracking-tight text-dark-900 font-display">
                        Access Denied
                    </h2>
                    <p className="mt-3 text-dark-500 font-medium">
                        You do not have permission to access the admin panel.
                    </p>
                </div>
                <div>
                    <a
                        href="/login"
                        className="btn-primary inline-flex justify-center w-full"
                    >
                        Return to Login
                    </a>
                </div>
            </div>
        </div>
    )
}
