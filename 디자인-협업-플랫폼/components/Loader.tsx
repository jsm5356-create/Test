
import React from 'react';

const Loader: React.FC<{ message: string }> = ({ message }) => {
  return (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-80 flex flex-col items-center justify-center z-50 backdrop-blur-sm">
      <div className="w-16 h-16 border-4 border-slate-500 border-t-cyan-400 rounded-full animate-spin"></div>
      <p className="mt-4 text-lg text-slate-200 font-semibold">{message}</p>
    </div>
  );
};

export default Loader;
