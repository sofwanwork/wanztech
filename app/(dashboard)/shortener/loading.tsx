export default function ShortenerLoading() {
    return (
        <div className="space-y-8 max-w-6xl mx-auto py-6 animate-pulse p-4 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="h-9 w-48 bg-gray-200 rounded mb-2" />
                    <div className="h-4 w-64 bg-gray-100 rounded" />
                </div>
                <div className="h-10 w-40 bg-gray-200 rounded-md" />
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(2)].map((_, i) => (
                    <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="h-4 w-24 bg-gray-200 rounded mb-4" />
                        <div className="h-8 w-16 bg-gray-200 rounded mb-2" />
                        <div className="h-3 w-32 bg-gray-100 rounded" />
                    </div>
                ))}
            </div>

            {/* Table */}
            <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
                <div className="p-6 border-b bg-gray-50/50">
                    <div className="h-6 w-24 bg-gray-200 rounded" />
                </div>
                <div className="p-0">
                    <div className="h-12 border-b bg-gray-50/50" />
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="p-4 border-b last:border-0 flex items-center justify-between">
                            <div className="h-4 w-1/3 bg-gray-100 rounded" />
                            <div className="h-4 w-1/4 bg-gray-100 rounded" />
                            <div className="h-4 w-16 bg-gray-200 rounded" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
