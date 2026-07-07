import React from 'react';

export function LoadingSpinner({ status = 'doing' }) {
  const isDoing = status === 'doing';
  const isSuccess = status === 'success';
  const isFailure = status === 'failure';

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="relative flex items-center justify-center">
        
        {/* Outer Ring - Spins on 'doing', completes full circle frame on 'success' or 'failure' */}
        <div 
          className={`
            rounded-full h-16 w-16 border-t-4 border-b-4 border-yellow-400 transition-all duration-500 ease-in-out
            ${isDoing ? 'animate-spin' : 'animate-none border-r-4 border-l-4 scale-105'}
          `}
        ></div>
    
        {/* Inner Circle - Stays unified yellow, scaling and popping when static */}
        <div 
          className={`
            absolute bg-yellow-300 h-10 w-10 rounded-full flex items-center justify-center shadow-md shadow-yellow-500/20 transition-all duration-500 ease-in-out
            ${!isDoing ? 'scale-110 shadow-yellow-500/50 brightness-105' : ''}
          `}
        >
          {/* Dynamic SVG Icon Container */}
          <svg 
            className="w-5 h-5 text-slate-950 transition-all duration-300" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            {isSuccess && (
              /* Success State: Checkmark */
              <polyline points="20 6 9 17 4 12" />
            )}

            {isFailure && (
              /* Failure State: Cross (Matches original theme weight/structure) */
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            )}

            {isDoing && (
              /* Doing State: Original Loading Shield */
              <>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 11 2 2 4-4" />
              </>
            )}
          </svg>
          
        </div>
      </div>
    </div>
  );
}