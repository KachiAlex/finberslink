import React from 'react';

interface PostContentProps {
  content: string;
  className?: string;
}

export function PostContent({ content, className = '' }: PostContentProps) {
  const renderContent = () => {
    // Enhanced markdown parsing for forum posts
    let html = content
      // Bold text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      // Italic text  
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      // Inline code
      .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">$1</code>')
      // Code blocks
      .replace(/```([^`]+)```/g, '<pre class="bg-gray-100 p-3 rounded-lg overflow-x-auto"><code class="text-sm">$1</code></pre>')
      // Blockquotes
      .replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-gray-300 pl-4 py-2 my-2 italic text-gray-600">$1</blockquote>')
      // Unordered lists
      .replace(/^- (.*$)/gim, '<li class="ml-4 list-disc">$1</li>')
      // Ordered lists
      .replace(/^\d+\. (.*$)/gim, '<li class="ml-4 list-decimal">$1</li>')
      // Headings
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-4 mb-2">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">$1</a>')
      // Line breaks
      .replace(/\n/g, '<br />')
      // Handle mentions (@username)
      .replace(/@([a-zA-Z0-9_]+)/g, '<span class="text-blue-600 font-medium">@$1</span>')
      // Handle hashtags
      .replace(/#([a-zA-Z0-9_]+)/g, '<span class="text-gray-600">#$1</span>');

    return { __html: html };
  };

  return (
    <div 
      className={`prose prose-sm max-w-none leading-relaxed ${className}`}
      dangerouslySetInnerHTML={renderContent()}
    />
  );
}
