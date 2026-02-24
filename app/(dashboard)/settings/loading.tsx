export default function SettingsLoading() {
    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8 animate-pulse">
            <div>
                <div className="h-9 w-40 bg-gray-200 rounded mb-2" />
                <div className="h-4 w-64 bg-gray-100 rounded" />
            </div>

            <div className="space-y-6 flex flex-col">
                <div className="h-10 w-full max-w-[400px] bg-gray-100 rounded-lg mx-auto border border-gray-200" />

                <div className="w-full bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-8">
                    <div className="h-6 w-32 bg-gray-200 rounded" />
                    <div className="flex gap-6 flex-col md:flex-row items-center md:items-start max-w-2xl">
                        <div className="h-20 w-20 rounded-full bg-gray-200 shrink-0" />
                        <div className="space-y-6 w-full">
                            <div>
                                <div className="h-4 w-20 bg-gray-200 rounded mb-2" />
                                <div className="h-10 w-full bg-gray-100 rounded-md" />
                            </div>
                            <div>
                                <div className="h-4 w-20 bg-gray-200 rounded mb-2" />
                                <div className="h-10 w-full bg-gray-100 rounded-md" />
                            </div>
                            <div className="h-10 w-32 bg-gray-200 rounded-md ml-auto" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
