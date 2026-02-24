export default function EcertLoading() {
    return (
        <div className="container mx-auto py-8 px-4 animate-pulse">
            <div className="mb-8">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-gray-200 rounded-full" />
                    <div className="h-9 w-64 bg-gray-200 rounded" />
                </div>
                <div className="h-4 w-48 bg-gray-100 rounded mt-2" />
            </div>

            {/* Certificates Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="h-5 w-48 bg-gray-200 rounded mb-2" />
                        <div className="h-4 w-24 bg-gray-100 rounded mb-4" />
                        <div className="h-40 bg-gray-100 rounded-lg" />
                    </div>
                ))}
            </div>
        </div>
    );
}
