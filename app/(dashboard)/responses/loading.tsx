export default function ResponsesLoading() {
    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6 animate-pulse">
            <div>
                <div className="h-9 w-48 bg-gray-200 rounded mb-2" />
                <div className="h-4 w-64 bg-gray-100 rounded" />
            </div>

            <div className="relative max-w-md">
                <div className="h-10 w-full bg-gray-100 rounded-md" />
            </div>

            <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                        <div className="h-5 w-1/3 bg-gray-200 rounded mb-4" />
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex-1">
                                <div className="h-3 w-24 bg-gray-100 rounded mb-2" />
                                <div className="h-4 w-2/3 bg-gray-100 rounded" />
                            </div>
                            <div className="h-9 w-32 bg-gray-200 rounded" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
