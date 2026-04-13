"use client";

import React, { useState, useCallback } from "react";
import { CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react";

interface Suggestion {
  id: string;
  category: "summary" | "achievement" | "skill" | "experience";
  originalText: string;
  suggestedText: string;
  explanation: string;
  confidenceLevel: "high" | "medium" | "low";
  targetField: string;
}

interface SuggestionReviewProps {
  resumeId: string;
  suggestions: Suggestion[];
  onApprove?: (suggestionIds: string[]) => void;
  onReject?: (suggestionIds: string[]) => void;
  onClose?: () => void;
}

const confidenceBadgeColor = {
  high: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  low: "bg-orange-100 text-orange-800",
};

const categoryLabel = {
  summary: "Summary",
  achievement: "Achievement",
  skill: "Skill",
  experience: "Experience",
};

export default function SuggestionReview({
  resumeId,
  suggestions,
  onApprove,
  onReject,
  onClose,
}: SuggestionReviewProps) {
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(
    new Set()
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [approvedCount, setApprovedCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);

  const toggleSuggestion = useCallback((id: string) => {
    setSelectedSuggestions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    if (selectedSuggestions.size === suggestions.length) {
      setSelectedSuggestions(new Set());
    } else {
      setSelectedSuggestions(new Set(suggestions.map((s) => s.id)));
    }
  }, [suggestions, selectedSuggestions.size]);

  const handleApproveSuggestions = async () => {
    if (selectedSuggestions.size === 0) {
      setError("Please select at least one suggestion to approve");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/resume/ai/suggestions/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeId,
          suggestionIds: Array.from(selectedSuggestions),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to approve suggestions");
      }

      const data = await response.json();
      setApprovedCount(data.appliedCount);
      setSelectedSuggestions(new Set());

      if (onApprove) {
        onApprove(Array.from(selectedSuggestions));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve suggestions");
    } finally {
      setLoading(false);
    }
  };

  const handleRejectSuggestions = async () => {
    if (selectedSuggestions.size === 0) {
      setError("Please select at least one suggestion to reject");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/resume/ai/suggestions/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeId,
          suggestionIds: Array.from(selectedSuggestions),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to reject suggestions");
      }

      const data = await response.json();
      setRejectedCount(data.rejectedCount);
      setSelectedSuggestions(new Set());

      if (onReject) {
        onReject(Array.from(selectedSuggestions));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject suggestions");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveAll = async () => {
    setSelectedSuggestions(new Set(suggestions.map((s) => s.id)));
    // Trigger approval after state update
    setTimeout(() => {
      handleApproveSuggestions();
    }, 0);
  };

  const handleRejectAll = async () => {
    setSelectedSuggestions(new Set(suggestions.map((s) => s.id)));
    // Trigger rejection after state update
    setTimeout(() => {
      handleRejectSuggestions();
    }, 0);
  };

  if (suggestions.length === 0) {
    return (
      <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-blue-800">No suggestions available at this time.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          AI Suggestions Review
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Review {suggestions.length} suggestion{suggestions.length !== 1 ? "s" : ""} to improve your resume. Approve or reject each suggestion individually, or use batch actions below.
        </p>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="bg-white p-3 rounded border border-blue-100">
            <p className="text-xs text-gray-600">Total Suggestions</p>
            <p className="text-2xl font-bold text-blue-600">{suggestions.length}</p>
          </div>
          <div className="bg-white p-3 rounded border border-green-100">
            <p className="text-xs text-gray-600">Approved</p>
            <p className="text-2xl font-bold text-green-600">{approvedCount}</p>
          </div>
          <div className="bg-white p-3 rounded border border-red-100">
            <p className="text-xs text-gray-600">Rejected</p>
            <p className="text-2xl font-bold text-red-600">{rejectedCount}</p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-900">Error</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Batch Actions */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={selectAll}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          disabled={loading}
        >
          {selectedSuggestions.size === suggestions.length
            ? "Deselect All"
            : "Select All"}
        </button>
        <button
          onClick={handleApproveSuggestions}
          disabled={selectedSuggestions.size === 0 || loading}
          className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Approve Selected ({selectedSuggestions.size})
        </button>
        <button
          onClick={handleRejectSuggestions}
          disabled={selectedSuggestions.size === 0 || loading}
          className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Reject Selected ({selectedSuggestions.size})
        </button>
      </div>

      {/* Suggestions List */}
      <div className="space-y-4">
        {suggestions.map((suggestion) => (
          <div
            key={suggestion.id}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            {/* Header */}
            <div className="flex items-start gap-4 mb-4">
              <input
                type="checkbox"
                checked={selectedSuggestions.has(suggestion.id)}
                onChange={() => toggleSuggestion(suggestion.id)}
                className="w-5 h-5 mt-1 rounded border-gray-300 text-blue-600 cursor-pointer"
              />

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                    {categoryLabel[suggestion.category]}
                  </span>
                  <span
                    className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                      confidenceBadgeColor[suggestion.confidenceLevel]
                    }`}
                  >
                    {suggestion.confidenceLevel.charAt(0).toUpperCase() +
                      suggestion.confidenceLevel.slice(1)}{" "}
                    Confidence
                  </span>
                </div>
              </div>
            </div>

            {/* Explanation */}
            <div className="mb-4 p-3 bg-gray-50 rounded border border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-1">Why this suggestion:</p>
              <p className="text-sm text-gray-600">{suggestion.explanation}</p>
            </div>

            {/* Before/After Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Original */}
              <div className="p-3 bg-red-50 rounded border border-red-200">
                <p className="text-xs font-medium text-red-900 mb-2 flex items-center gap-1">
                  <XCircle className="w-4 h-4" /> Original
                </p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {suggestion.originalText}
                </p>
              </div>

              {/* Suggested */}
              <div className="p-3 bg-green-50 rounded border border-green-200">
                <p className="text-xs font-medium text-green-900 mb-2 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" /> Suggested
                </p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {suggestion.suggestedText}
                </p>
              </div>
            </div>

            {/* Target Field Info */}
            <div className="text-xs text-gray-500 mb-4">
              Target field: <code className="bg-gray-100 px-1 rounded">{suggestion.targetField}</code>
            </div>

            {/* Individual Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSelectedSuggestions(new Set([suggestion.id]));
                  setTimeout(() => handleApproveSuggestions(), 0);
                }}
                disabled={loading}
                className="flex-1 px-3 py-2 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Approve
              </button>
              <button
                onClick={() => {
                  setSelectedSuggestions(new Set([suggestion.id]));
                  setTimeout(() => handleRejectSuggestions(), 0);
                }}
                disabled={loading}
                className="flex-1 px-3 py-2 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Actions */}
      <div className="flex gap-2 pt-4 border-t">
        <button
          onClick={handleApproveAll}
          disabled={loading}
          className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          Approve All
        </button>
        <button
          onClick={handleRejectAll}
          disabled={loading}
          className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
        >
          Reject All
        </button>
        {onClose && (
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
}
