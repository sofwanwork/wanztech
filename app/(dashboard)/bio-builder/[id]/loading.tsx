export default function BioBuilderLoading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto py-6 animate-pulse p-4 md:p-8">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-gray-200 rounded-lg" />
          <div className="space-y-1">
            <div className="h-6 w-48 bg-gray-200 rounded" />
            <div className="h-4 w-32 bg-gray-100 rounded" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-24 bg-gray-200 rounded-md" />
          <div className="h-9 w-28 bg-gray-200 rounded-md" />
        </div>
      </div>

      {/* Main split view */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
          <div className="h-10 bg-gray-100 rounded-xl" />
          <div className="space-y-4">
            <div className="h-12 bg-gray-100 rounded-xl" />
            <div className="h-20 bg-gray-100 rounded-xl" />
            <div className="h-20 bg-gray-100 rounded-xl" />
          </div>
        </div>

        <div className="hidden lg:flex lg:col-span-5 justify-center">
          <div className="w-[340px] h-[640px] rounded-[44px] border-[10px] border-gray-800 bg-gray-100 p-4" />
        </div>
      </div>
    </div>
  );
}
