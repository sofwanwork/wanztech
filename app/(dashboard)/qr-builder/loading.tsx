export default function QrBuilderLoading() {
    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-pulse">
            {/* Stats Placeholder */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="h-4 w-24 bg-gray-200 rounded mb-4" />
                    <div className="h-8 w-16 bg-gray-200 rounded mb-2" />
                    <div className="h-3 w-20 bg-gray-100 rounded" />
                </div>
            </div>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <div className="h-9 w-40 bg-gray-200 rounded mb-2" />
                    <div className="h-4 w-64 bg-gray-100 rounded" />
                </div>
                <div className="flex items-center gap-3">
                    <div className="h-10 w-48 bg-gray-100 rounded-lg hidden md:block" />
                    <div className="h-10 w-24 bg-gray-100 rounded-lg" />
                    <div className="h-10 w-32 bg-gray-200 rounded-lg" />
                </div>
            </div>

            {/* Mobile search */}
            <div className="md:hidden h-10 w-full bg-gray-100 rounded-lg" />

            {/* QR List Placeholder */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden p-4">
                        <div className="h-32 bg-gray-100 rounded-lg mb-4" />
                        <div className="h-5 w-3/4 bg-gray-200 rounded mb-2" />
                        <div className="h-4 w-full bg-gray-100 rounded" />
                    </div>
                ))}
            </div>
        </div>
    );
}
