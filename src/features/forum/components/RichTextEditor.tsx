"use client";

import React, { useState, useRef, useCallback } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  showCharCount?: boolean;
  className?: string;
}

export function RichTextEditor({ 
  value, 
  onChange, 
  placeholder = 'Write your message...', 
  maxLength = 5000,
  showCharCount = true,
  className = ''
}: RichTextEditorProps) {
  const [isPreview, setIsPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [selectionStart, setSelectionStart] = useState(0);
  const [selectionEnd, setSelectionEnd] = useState(0);

  const insertText = useCallback((before: string, after: string = '') => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);
    onChange(newText);
    
    // Set cursor position after insertion
    setTimeout(() => {
      const newCursorPos = start + before.length + selectedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
      textarea.focus();
    }, 0);
  }, [value, onChange]);

  const insertBold = () => insertText('**', '**');
  const insertItalic = () => insertText('*', '*');
  const insertCode = () => insertText('`', '`');
  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) insertText('[', `](${url})`);
  };
  const insertQuote = () => insertText('> ');
  const insertList = () => insertText('- ');
  const insertHeading = () => insertText('## ');

  const formatButtons = [
    { icon: 'B', title: 'Bold', action: insertBold, className: 'font-bold' },
    { icon: 'I', title: 'Italic', action: insertItalic, className: 'italic' },
    { icon: '</>', title: 'Code', action: insertCode, className: 'font-mono text-sm' },
    { icon: 'Link', title: 'Link', action: insertLink, className: 'text-blue-600' },
    { icon: '"', title: 'Quote', action: insertQuote, className: 'text-gray-600' },
    { icon: 'List', title: 'List', action: insertList, className: 'text-gray-600' },
    { icon: 'H2', title: 'Heading', action: insertHeading, className: 'text-lg' },
  ];

  const renderPreview = () => {
    // Simple markdown parsing (in production, use a proper markdown library)
    let html = value
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 rounded text-sm">$1</code>')
      .replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-gray-300 pl-4 italic">$1</blockquote>')
      .replace(/^- (.*$)/gim, '<li class="ml-4">$1</li>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-4 mb-2">$1</h2>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 underline" target="_blank" rel="noopener noreferrer">$1</a>')
      .replace(/\n/g, '<br />');

    return { __html: html };
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (maxLength && newValue.length > maxLength) return;
    onChange(newValue);
    setSelectionStart(e.target.selectionStart);
    setSelectionEnd(e.target.selectionEnd);
  };

  return (
    <div className={`border rounded-lg overflow-hidden ${className}`}>
      {/* Toolbar */}
      <div className="bg-gray-50 border-b px-3 py-2 flex items-center gap-1 flex-wrap">
        {formatButtons.map((button, index) => (
          <button
            key={index}
            type="button"
            onClick={button.action}
            title={button.title}
            className={`px-2 py-1 text-sm hover:bg-gray-200 rounded transition-colors ${button.className}`}
          >
            {button.icon}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPreview(!isPreview)}
            className={`px-2 py-1 text-sm rounded transition-colors ${
              isPreview 
                ? 'bg-blue-100 text-blue-700' 
                : 'hover:bg-gray-200'
            }`}
          >
            {isPreview ? 'Edit' : 'Preview'}
          </button>
        </div>
      </div>

      {/* Editor/Preview */}
      <div className="min-h-[150px]">
        {isPreview ? (
          <div className="p-4 prose prose-sm max-w-none">
            {value ? (
              <div dangerouslySetInnerHTML={renderPreview()} />
            ) : (
              <div className="text-gray-400 italic">Nothing to preview</div>
            )}
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleTextChange}
            placeholder={placeholder}
            className="w-full p-4 resize-none focus:outline-none min-h-[150px]"
            maxLength={maxLength}
          />
        )}
      </div>

      {/* Character count */}
      {showCharCount && maxLength && (
        <div className="bg-gray-50 border-t px-3 py-1 text-xs text-gray-500 text-right">
          {value.length} / {maxLength} characters
        </div>
      )}

      {/* Markdown help */}
      {!isPreview && (
        <div className="bg-gray-50 border-t px-3 py-2 text-xs text-gray-600">
          <div className="font-semibold mb-1">Formatting tips:</div>
          <div className="grid grid-cols-2 gap-2">
            <div>**Bold** for bold text</div>
            <div>*Italic* for italic text</div>
            <div>`Code` for code</div>
            <div>[Text](url) for links</div>
            <div>&gt; Quote for quotes</div>
            <div>- List item for lists</div>
            <div>## Heading for headings</div>
            <div>@username to mention users</div>
          </div>
        </div>
      )}
    </div>
  );
}
