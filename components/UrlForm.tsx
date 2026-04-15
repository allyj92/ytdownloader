"use client";

import React, { useState } from "react";

interface UrlFormProps {
  onInfoFetched: (url: string) => void;
  isLoading: boolean;
}

const UrlForm: React.FC<UrlFormProps> = ({ onInfoFetched, isLoading }) => {
  const [url, setUrl] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onInfoFetched(url);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto mt-8 p-4">
      <div className="flex flex-col md:flex-row gap-4">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter YouTube URL (e.g. https://www.youtube.com/watch?v=...)"
          className="flex-grow p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-black shadow-sm"
          required
        />
        <button
          type="submit"
          disabled={isLoading}
          className={`p-4 bg-red-600 text-white font-bold rounded-lg transition-all shadow-md ${
            isLoading ? "opacity-50 cursor-not-allowed" : "hover:bg-red-700 active:scale-95"
          }`}
        >
          {isLoading ? "Checking..." : "Check"}
        </button>
      </div>
    </form>
  );
};

export default UrlForm;
