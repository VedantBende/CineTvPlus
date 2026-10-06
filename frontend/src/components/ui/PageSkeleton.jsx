import React from 'react';

export const CardSkeleton = () => (
  <div className="flex-none w-[42vw] xs:w-[30vw] sm:w-[28vw] md:w-[22vw] lg:w-[17vw] xl:w-[14vw] px-1.5 py-1">
    <div className="netflix-card rounded-lg bg-white/0 shadow-sm">
      <div className="w-full aspect-[2/3] bg-zinc-800 animate-pulse rounded-lg" />
      <div className="p-2 pt-2.5">
        <div className="h-3 w-3/4 bg-zinc-800 rounded animate-pulse mb-2" />
        <div className="flex justify-between mt-1">
          <div className="h-2.5 w-1/3 bg-zinc-800 rounded animate-pulse" />
          <div className="h-2.5 w-1/4 bg-zinc-800 rounded animate-pulse" />
        </div>
      </div>
    </div>
  </div>
);

export const GridCardSkeleton = () => (
  <div className="px-1.5 py-1 w-full">
    <div className="netflix-card rounded-lg bg-white/0 shadow-sm">
      <div className="w-full aspect-[2/3] bg-zinc-800 animate-pulse rounded-lg" />
      <div className="p-2 pt-2.5">
        <div className="h-3 w-3/4 bg-zinc-800 rounded animate-pulse mb-2" />
        <div className="flex justify-between mt-1">
          <div className="h-2.5 w-1/3 bg-zinc-800 rounded animate-pulse" />
          <div className="h-2.5 w-1/4 bg-zinc-800 rounded animate-pulse" />
        </div>
      </div>
    </div>
  </div>
);

const RowSkeleton = ({ titleWidth = "w-48" }) => (
  <div className="w-full mb-8">
    <div className={`h-6 sm:h-8 ${titleWidth} bg-zinc-800 animate-pulse rounded-md mb-4 ml-4 sm:ml-8 md:ml-12`} />
    <div className="flex space-x-3 xs:space-x-4 sm:space-x-6 overflow-hidden px-4 sm:px-8 md:px-12">
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </div>
  </div>
);

const GridSkeleton = () => (
  <div className="w-full">
    <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5 lg:gap-6 px-4">
      <GridCardSkeleton />
      <GridCardSkeleton />
      <GridCardSkeleton />
      <GridCardSkeleton />
      <GridCardSkeleton />
      <GridCardSkeleton />
    </div>
  </div>
);

function PageSkeleton({ type = 'home' }) {
  if (type === 'home') {
    return (
      <div className="min-h-screen bg-netflix-black w-full overflow-hidden">
        {/* Hero Skeleton */}
        <div className="relative h-[75vh] xs:h-[60vh] sm:h-[65vh] md:h-[70vh] lg:h-[80vh] xl:h-[110vh] bg-gradient-to-b from-gray-100 to-white dark:from-black dark:to-netflix-black overflow-hidden -mt-14 sm:-mt-16 md:-mt-16 pt-14 sm:pt-16 md:pt-16 transition mb-8">
          <div className="absolute inset-0 bg-zinc-800 animate-pulse" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent z-10" />
          <div className="absolute bottom-0 left-0 right-0 h-24 xs:h-28 sm:h-32 md:h-40 lg:h-48 bg-gradient-to-t from-netflix-black dark:from-netflix-black via-netflix-black/80 to-transparent z-10" />
           
          {/* Hero Content Overlay */}
          <div className="absolute bottom-0 left-0 right-0 pb-12 xs:pb-14 sm:pb-16 md:pb-20 lg:pb-24 p-3 xs:p-4 sm:p-6 md:p-8 lg:p-10 xl:p-16 container-custom z-20">
            <div className="relative max-w-xs xs:max-w-sm sm:max-w-xl md:max-w-2xl lg:max-w-3xl">
              {/* Title Skeleton */}
              <div className="h-8 xs:h-10 sm:h-12 md:h-16 lg:h-20 w-3/4 bg-zinc-700 animate-pulse rounded-md mb-2 xs:mb-3 sm:mb-4 lg:mb-6" />
              
              {/* Badges Skeleton */}
              <div className="flex flex-wrap items-center gap-1.5 xs:gap-2 sm:gap-3 mb-2 xs:mb-3 sm:mb-4 lg:mb-5">
                <div className="h-5 xs:h-6 sm:h-7 md:h-8 w-16 bg-zinc-700 animate-pulse rounded" />
                <div className="h-5 xs:h-6 sm:h-7 md:h-8 w-16 bg-zinc-700 animate-pulse rounded" />
              </div>

              {/* Overview Skeleton */}
              <div className="space-y-2 mb-3 xs:mb-4 sm:mb-6 md:mb-8 lg:mb-10">
                <div className="h-4 sm:h-5 w-full bg-zinc-700 animate-pulse rounded" />
                <div className="h-4 sm:h-5 w-11/12 bg-zinc-700 animate-pulse rounded" />
                <div className="h-4 sm:h-5 w-4/5 bg-zinc-700 animate-pulse rounded" />
              </div>

              {/* Buttons Skeleton */}
              <div className="flex flex-wrap gap-2 xs:gap-3 sm:gap-4 lg:gap-5">
                <div className="h-10 xs:h-12 sm:h-14 w-32 xs:w-36 sm:w-40 bg-zinc-700 animate-pulse rounded" />
                <div className="h-10 xs:h-12 sm:h-14 w-40 xs:w-48 sm:w-52 bg-zinc-700 animate-pulse rounded" />
              </div>
            </div>
          </div>
          
          {/* Carousel Indicators Skeleton */}
          <div className="absolute bottom-4 sm:bottom-6 left-0 right-0 flex justify-center space-x-2 z-20">
            {[...Array(5)].map((_, i) => (
              <div key={i} className={`h-1.5 sm:h-2 rounded-full bg-zinc-700 animate-pulse ${i === 1 ? 'w-4 sm:w-6' : 'w-1.5 sm:w-2'}`} />
            ))}
          </div>
        </div>

        {/* Content Rows */}
        <div className="container-custom pb-20">
          <RowSkeleton titleWidth="w-48" />
          <RowSkeleton titleWidth="w-64" />
          <RowSkeleton titleWidth="w-56" />
        </div>
      </div>
    );
  }

  if (type === 'cards') {
    return (
      <div className="w-full bg-transparent py-4 animate-pulse">
        <RowSkeleton titleWidth="w-48" />
      </div>
    );
  }

  if (type === 'grid') {
    return (
      <div className="min-h-screen pt-24 bg-netflix-black w-full overflow-hidden animate-pulse">
        <div className="container-custom">
          <GridSkeleton />
        </div>
      </div>
    );
  }

  if (type === 'gridCards') {
    return (
      <div className="w-full bg-transparent py-4 animate-pulse">
        <GridSkeleton />
      </div>
    );
  }

  if (type === 'details') {
    return (
      <div className="min-h-screen bg-white dark:bg-netflix-black w-full overflow-hidden transition-colors duration-300">
        {/* Hero Section Skeleton */}
        <div className="relative h-[95vh] sm:h-[60vh] md:h-[65vh] lg:h-[110vh] -mt-14 sm:-mt-16 md:-mt-16 pt-14 sm:pt-16 md:pt-16 bg-gradient-to-b from-gray-100 to-white dark:from-black dark:to-netflix-black transition-colors duration-500">
          <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-netflix-black via-white/60 dark:via-netflix-black/60 to-transparent z-10" />
          
          {/* Backdrop Image Placeholder */}
          <div className="w-full h-full bg-zinc-800 animate-pulse opacity-80" />

          {/* Hero Content Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-8 lg:p-12 container-custom z-20">
            {/* Title Skeleton */}
            <div className="h-10 sm:h-12 md:h-16 w-3/4 max-w-2xl bg-zinc-700 animate-pulse rounded-md mb-2 sm:mb-3 md:mb-4" />
            
            {/* Badges Skeleton */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4 md:mb-6">
              <div className="h-6 sm:h-8 w-16 bg-zinc-700 animate-pulse rounded" />
              <div className="h-6 sm:h-8 w-24 bg-zinc-700 animate-pulse rounded" />
              <div className="h-6 sm:h-8 w-32 bg-zinc-700 animate-pulse rounded" />
            </div>

            {/* Overview Skeleton (Desktop) */}
            <div className="hidden sm:block space-y-2 max-w-3xl mb-3 sm:mb-4 md:mb-6">
              <div className="h-4 sm:h-5 w-full bg-zinc-700 animate-pulse rounded" />
              <div className="h-4 sm:h-5 w-11/12 bg-zinc-700 animate-pulse rounded" />
              <div className="h-4 sm:h-5 w-4/5 bg-zinc-700 animate-pulse rounded" />
            </div>

            {/* Buttons Skeleton */}
            <div className="flex flex-wrap gap-2 sm:gap-3 md:gap-4">
              <div className="h-10 sm:h-12 w-32 sm:w-40 bg-zinc-700 animate-pulse rounded" />
              <div className="h-10 sm:h-12 w-40 sm:w-48 bg-zinc-700 animate-pulse rounded" />
              <div className="h-10 sm:h-12 w-28 sm:w-32 bg-zinc-700 animate-pulse rounded" />
            </div>
          </div>
        </div>

        {/* Content Section Skeleton */}
        <div className="container-custom py-6 sm:py-8 md:py-10 lg:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 md:gap-10 lg:gap-12">
            
            {/* Main Content (Left) */}
            <div className="lg:col-span-2 order-2 lg:order-1 space-y-8 sm:space-y-12">
              
              {/* Episodes / Details Block Skeleton */}
              <div>
                <div className="h-8 w-48 bg-zinc-800 animate-pulse rounded mb-4" />
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-20 bg-zinc-800 animate-pulse rounded-xl" />
                  ))}
                </div>
              </div>

              {/* Cast Skeleton */}
              <div>
                <div className="h-6 w-32 bg-zinc-800 animate-pulse rounded mb-4" />
                <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3 sm:gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex flex-col items-center">
                      <div className="w-full aspect-square bg-zinc-800 animate-pulse rounded-full mb-2" />
                      <div className="h-3 w-16 bg-zinc-800 animate-pulse rounded" />
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Sidebar (Right) */}
            <div className="order-1 lg:order-2">
              {/* Poster Skeleton */}
              <div className="mb-4 sm:mb-6">
                <div className="w-full max-w-xs mx-auto lg:max-w-full lg:mx-0 aspect-[2/3] bg-zinc-800 animate-pulse rounded-lg shadow-lg" />
              </div>
              
              {/* Details Box Skeleton */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 sm:p-5 md:p-6 border border-gray-100 dark:border-transparent">
                <div className="h-6 w-24 bg-zinc-700 animate-pulse rounded mb-4" />
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i}>
                      <div className="h-3 w-20 bg-zinc-700 animate-pulse rounded mb-2" />
                      <div className="h-4 w-32 bg-zinc-700 animate-pulse rounded" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }

  if (type === 'admin') {
    return (
      <div className="min-h-screen pt-20 bg-gray-50 dark:bg-netflix-black px-4 sm:px-6 lg:px-8 pb-10 transition-colors duration-300">
        <div className="max-w-7xl mx-auto w-full animate-pulse">
          
          {/* Header Skeleton */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <div className="h-10 w-64 bg-zinc-200 dark:bg-zinc-800 rounded border-l-4 border-transparent pl-3 mb-2" />
              <div className="h-5 w-80 bg-zinc-200 dark:bg-zinc-800 rounded" />
            </div>
          </div>

          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm dark:shadow-lg flex items-center justify-between">
                <div>
                  <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-800 rounded mb-2" />
                  <div className="h-8 w-12 bg-zinc-300 dark:bg-zinc-700 rounded" />
                </div>
                <div className="h-12 w-12 bg-gray-100 dark:bg-zinc-800/50 rounded-lg" />
              </div>
            ))}
          </div>

          {/* Search & Filters Skeleton */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 bg-white dark:bg-zinc-900/50 p-4 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm dark:shadow-none">
            <div className="w-full md:w-96 h-10 bg-gray-50 dark:bg-black border border-gray-300 dark:border-zinc-700 rounded-lg" />
            <div className="flex bg-gray-100 dark:bg-black/50 p-1 rounded-lg border border-gray-200 dark:border-zinc-800 gap-1 w-full md:w-auto overflow-hidden">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-8 w-20 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
              ))}
            </div>
          </div>

          {/* Table Skeleton */}
          <div className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 shadow-sm dark:shadow-xl rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-800/50 text-left">
                <thead className="bg-gray-50 dark:bg-zinc-900/50">
                  <tr>
                    <th className="px-6 py-4"><div className="h-3 w-24 bg-zinc-200 dark:bg-zinc-800 rounded" /></th>
                    <th className="px-6 py-4"><div className="h-3 w-16 bg-zinc-200 dark:bg-zinc-800 rounded" /></th>
                    <th className="px-6 py-4"><div className="h-3 w-20 bg-zinc-200 dark:bg-zinc-800 rounded" /></th>
                    <th className="px-6 py-4 text-right"><div className="h-3 w-20 bg-zinc-200 dark:bg-zinc-800 rounded ml-auto" /></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-zinc-800/50 bg-white dark:bg-transparent">
                  {[...Array(5)].map((_, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-zinc-200 dark:bg-zinc-800 flex-shrink-0" />
                          <div className="ml-4 space-y-2">
                            <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded" />
                            <div className="h-3 w-48 bg-zinc-100 dark:bg-zinc-800/60 rounded" />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-6 w-16 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-7 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex justify-end gap-2">
                          <div className="h-8 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
                          <div className="h-8 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    );
  }

  if (type === 'livetv') {
    return (
      <div className="container-custom pt-24 pb-12 min-h-screen">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 px-4 sm:px-0">
          <div>
            <div className="h-10 w-48 bg-zinc-800 animate-pulse rounded border-l-4 border-transparent pl-3 mb-2" />
            <div className="h-5 w-64 bg-zinc-800 animate-pulse rounded" />
          </div>
          <div className="w-full md:w-96 h-12 bg-zinc-900 animate-pulse rounded-full border border-zinc-800" />
        </div>

        {/* Categories Skeleton */}
        <div className="flex gap-2 px-4 sm:px-0 mb-6 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div key={i} className={`flex-shrink-0 h-8 rounded-full bg-zinc-900 animate-pulse border border-zinc-800 ${i === 0 ? 'w-16' : 'w-24'}`} />
          ))}
        </div>

        {/* Bento Grid Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-5 auto-rows-[200px]">
          {[...Array(15)].map((_, i) => {
            const isFeatured = i === 0;
            return (
              <div 
                key={i}
                className={`relative rounded-xl bg-zinc-900 animate-pulse border border-zinc-800/80 shadow-md flex flex-col justify-end p-4 ${
                  isFeatured ? 'col-span-2 row-span-2' : 'col-span-1 row-span-1'
                }`}
              >
                {/* Simulated content placeholders */}
                <div className="flex items-center justify-between mb-2">
                  <div className="h-6 w-16 bg-zinc-800 rounded-md" />
                  <div className="h-4 w-6 bg-zinc-800 rounded" />
                </div>
                <div className={`bg-zinc-800 rounded mb-2 ${isFeatured ? 'h-6 w-3/4' : 'h-4 w-3/4'}`} />
                <div className={`bg-zinc-800 rounded ${isFeatured ? 'h-4 w-1/2' : 'h-3 w-1/2'}`} />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
}

export default PageSkeleton;
