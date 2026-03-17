import { Loader2, Sparkles } from 'lucide-react';

const LoadingSpinner = ({ size = 'default', text = 'Loading...', fullScreen = false }) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    default: 'w-8 h-8',
    large: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const containerClasses = fullScreen 
    ? 'fixed inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex flex-col items-center justify-center z-50'
    : 'flex flex-col items-center justify-center min-h-[200px] space-y-4';

  return (
    <div className={containerClasses}>
      <div className="relative">
        {/* Outer spinning ring */}
        <div className="absolute inset-0 rounded-full border-4 border-blue-200 animate-spin"></div>
        
        {/* Inner spinning ring */}
        <div className="absolute inset-2 rounded-full border-4 border-purple-200 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
        
        {/* Center icon */}
        <div className={`relative ${sizeClasses[size]} flex items-center justify-center`}>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
            <Sparkles className="w-1/2 h-1/2 text-white animate-pulse" />
          </div>
        </div>
      </div>
      
      {text && (
        <div className="text-center mt-6 space-y-2">
          <p className="text-lg font-semibold text-gray-900">{text}</p>
          <div className="flex items-center justify-center space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      )}
      
      {fullScreen && (
        <div className="absolute bottom-8 text-center">
          <p className="text-sm text-gray-500">Please wait while we prepare everything for you</p>
        </div>
      )}
    </div>
  );
};

export default LoadingSpinner;