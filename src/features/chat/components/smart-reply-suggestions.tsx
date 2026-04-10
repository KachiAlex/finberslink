"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Lightbulb, 
  ThumbsUp, 
  MessageSquare, 
  Clock, 
  Send, 
  Sparkles,
  Brain,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@//components/ui/scroll-area";

interface SmartReply {
  id: string;
  text: string;
  type: 'quick_reply' | 'suggestion' | 'completion' | 'template';
  confidence: number;
  category?: string;
  context?: string;
}

interface MessageContext {
  threadId?: string;
  conversationId?: string;
  lastMessages: Array<{
    id: string;
    content: string;
    authorId: string;
    author: {
      firstName: string | null;
      lastName: string | null;
    };
    sentAt: string;
  }>;
  currentInput: string;
  participants: Array<{
    userId: string;
    firstName: string | null;
    lastName: string | null;
  }>;
}

interface SmartReplySuggestionsProps {
  context: MessageContext;
  currentUserId: string;
  onSelectSuggestion: (suggestion: string, type: string) => void;
  onDismissSuggestion: (suggestionId: string) => void;
  isEnabled?: boolean;
}

export function SmartReplySuggestions({
  context,
  currentUserId,
  onSelectSuggestion,
  onDismissSuggestion,
  isEnabled = true
}: SmartReplySuggestionsProps) {
  const [suggestions, setSuggestions] = useState<SmartReply[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const inputRef = useRef<HTMLInputElement>(null);

  // Generate smart replies based on context
  useEffect(() => {
    if (!isEnabled || !context.currentInput.trim()) {
      setSuggestions([]);
      return;
    }

    const generateSmartReplies = async () => {
      setIsLoading(true);
      try {
        // Simulate AI processing delay
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const mockSuggestions: SmartReply[] = generateContextualReplies(context);
        setSuggestions(mockSuggestions);
      } catch (error) {
        console.error('Failed to generate smart replies:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(generateSmartReplies, 500);
    return () => clearTimeout(debounceTimer);
  }, [context.currentInput, context.lastMessages, isEnabled]);

  const generateContextualReplies = (ctx: MessageContext): SmartReply[] => {
    const replies: SmartReply[] = [];
    const input = ctx.currentInput.toLowerCase();
    const lastMessage = ctx.lastMessages[ctx.lastMessages.length - 1];

    // Quick replies for common patterns
    if (input.includes('thank') || input.includes('thanks')) {
      replies.push({
        id: 'thanks1',
        text: "You're welcome! Happy to help!",
        type: 'quick_reply',
        confidence: 0.95,
        category: 'gratitude'
      });
      replies.push({
        id: 'thanks2',
        text: "No problem! Let me know if you need anything else.",
        type: 'quick_reply',
        confidence: 0.88,
        category: 'gratitude'
      });
    }

    if (input.includes('help') || input.includes('question')) {
      replies.push({
        id: 'help1',
        text: "I'd be happy to help! What specifically do you need assistance with?",
        type: 'suggestion',
        confidence: 0.92,
        category: 'support'
      });
      replies.push({
        id: 'help2',
        text: "I can help with that. Could you provide more details?",
        type: 'suggestion',
        confidence: 0.85,
        category: 'support'
      });
    }

    if (input.includes('meet') || input.includes('call') || input.includes('discuss')) {
      replies.push({
        id: 'meet1',
        text: "Sure! When works best for you? I'm available this week.",
        type: 'suggestion',
        confidence: 0.90,
        category: 'scheduling'
      });
      replies.push({
        id: 'meet2',
        text: "Let's schedule a call. How about tomorrow at 2 PM?",
        type: 'suggestion',
        confidence: 0.82,
        category: 'scheduling'
      });
    }

    // Context-aware replies based on last message
    if (lastMessage && lastMessage.authorId !== currentUserId) {
      const lastContent = lastMessage.content.toLowerCase();
      
      if (lastContent.includes('assignment') || lastContent.includes('homework')) {
        replies.push({
          id: 'assignment1',
          text: "I can help with the assignment. Which part are you stuck on?",
          type: 'suggestion',
          confidence: 0.87,
          category: 'academic'
        });
        replies.push({
          id: 'assignment2',
          text: "Let me review the assignment requirements and share some resources.",
          type: 'suggestion',
          confidence: 0.79,
          category: 'academic'
        });
      }

      if (lastContent.includes('project') || lastContent.includes('work')) {
        replies.push({
          id: 'project1',
          text: "Great! How can I contribute to the project?",
          type: 'suggestion',
          confidence: 0.84,
          category: 'collaboration'
        });
      }
    }

    // Auto-completion suggestions
    if (input.length > 2 && input.length < 10) {
      const completions = [
        { text: "I think that's a great idea", confidence: 0.75 },
        { text: "I agree with your point", confidence: 0.72 },
        { text: "That makes sense", confidence: 0.70 },
        { text: "Could you elaborate on that?", confidence: 0.68 },
        { text: "I see what you mean", confidence: 0.65 }
      ];

      completions.forEach((comp, index) => {
        if (comp.text.toLowerCase().includes(input)) {
          replies.push({
            id: `completion${index}`,
            text: comp.text,
            type: 'completion',
            confidence: comp.confidence,
            category: 'completion'
          });
        }
      });
    }

    // Template suggestions
    if (input.includes('welcome') || input.includes('intro')) {
      replies.push({
        id: 'welcome1',
        text: "Welcome to the course! I'm excited to learn with everyone.",
        type: 'template',
        confidence: 0.88,
        category: 'introduction'
      });
    }

    // Sort by confidence and limit to top 5
    return replies
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5);
  };

  const filteredSuggestions = selectedCategory === 'all' 
    ? suggestions 
    : suggestions.filter(s => s.category === selectedCategory);

  const categories = Array.from(new Set(suggestions.map(s => s.category).filter(Boolean)));

  const getTypeIcon = (type: SmartReply['type']) => {
    switch (type) {
      case 'quick_reply': return <Zap className="w-3 h-3 text-yellow-500" />;
      case 'suggestion': return <Lightbulb className="w-3 h-3 text-blue-500" />;
      case 'completion': return <Sparkles className="w-3 h-3 text-purple-500" />;
      case 'template': return <MessageSquare className="w-3 h-3 text-green-500" />;
      default: return <Brain className="w-3 h-3 text-gray-500" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'bg-green-100 text-green-800';
    if (confidence >= 0.7) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  const handleSelectSuggestion = (suggestion: SmartReply) => {
    onSelectSuggestion(suggestion.text, suggestion.type);
    onDismissSuggestion(suggestion.id);
    setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
  };

  const handleDismissAll = () => {
    suggestions.forEach(s => onDismissSuggestion(s.id));
    setSuggestions([]);
  };

  if (!isEnabled || suggestions.length === 0) {
    return null;
  }

  return (
    <div className="border-t border-gray-200 bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center space-x-2">
          <Brain className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium">Smart Suggestions</span>
          <Badge variant="outline" className="text-xs">
            {suggestions.length}
          </Badge>
        </div>
        <div className="flex items-center space-x-2">
          {categories.length > 1 && (
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs border border-gray-300 rounded px-2 py-1"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          )}
          <Button variant="ghost" size="sm" onClick={handleDismissAll} className="text-xs">
            Dismiss All
          </Button>
        </div>
      </div>

      {/* Suggestions */}
      <ScrollArea className="max-h-48">
        <div className="p-2 space-y-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-sm text-gray-600">Generating suggestions...</span>
            </div>
          ) : (
            filteredSuggestions.map((suggestion) => (
              <Card key={suggestion.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        {getTypeIcon(suggestion.type)}
                        <span className="text-xs font-medium capitalize text-gray-600">
                          {suggestion.type.replace('_', ' ')}
                        </span>
                        <Badge className={`text-xs ${getConfidenceColor(suggestion.confidence)}`}>
                          {Math.round(suggestion.confidence * 100)}%
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-900 line-clamp-2">
                        {suggestion.text}
                      </p>
                    </div>
                    <div className="flex space-x-1 ml-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSelectSuggestion(suggestion)}
                        className="h-6 px-2 text-xs"
                      >
                        <Send className="w-3 h-3 mr-1" />
                        Use
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDismissSuggestion(suggestion.id)}
                        className="h-6 w-6 p-0"
                      >
                        ×
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// AI-powered message completion component
export function MessageCompletion({
  currentInput,
  onSelectCompletion,
  isEnabled = true
}: {
  currentInput: string;
  onSelectCompletion: (completion: string) => void;
  isEnabled?: boolean;
}) {
  const [completions, setCompletions] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  useEffect(() => {
    if (!isEnabled || currentInput.length < 3) {
      setCompletions([]);
      setSelectedIndex(-1);
      return;
    }

    const generateCompletions = () => {
      // Mock AI completions based on input
      const commonPhrases = [
        "I think that's a great point",
        "I agree with what you're saying",
        "That makes perfect sense",
        "I hadn't thought of it that way",
        "Could you explain more about",
        "I'm not sure I understand",
        "Let me look into that for you",
        "That's an interesting perspective",
        "I see where you're coming from",
        "Thanks for sharing that"
      ];

      const filtered = commonPhrases.filter(phrase =>
        phrase.toLowerCase().includes(currentInput.toLowerCase())
      );

      setCompletions(filtered.slice(0, 3));
    };

    const debounceTimer = setTimeout(generateCompletions, 200);
    return () => clearTimeout(debounceTimer);
  }, [currentInput, isEnabled]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (completions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % completions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev <= 0 ? completions.length - 1 : prev - 1);
    } else if (e.key === 'Tab' && selectedIndex >= 0) {
      e.preventDefault();
      onSelectCompletion(completions[selectedIndex]);
      setCompletions([]);
      setSelectedIndex(-1);
    } else if (e.key === 'Escape') {
      setCompletions([]);
      setSelectedIndex(-1);
    }
  };

  if (!isEnabled || completions.length === 0) {
    return null;
  }

  return (
    <div className="absolute bottom-full left-0 right-0 bg-white border border-gray-200 rounded-t-lg shadow-lg z-10">
      <div className="p-2">
        <div className="flex items-center space-x-2 mb-2">
          <Sparkles className="w-3 h-3 text-purple-500" />
          <span className="text-xs font-medium text-gray-600">Press Tab to accept</span>
        </div>
        <div className="space-y-1">
          {completions.map((completion, index) => (
            <div
              key={index}
              className={`px-2 py-1 text-sm rounded cursor-pointer ${
                index === selectedIndex
                  ? 'bg-blue-100 text-blue-900'
                  : 'hover:bg-gray-100'
              }`}
              onClick={() => {
                onSelectCompletion(completion);
                setCompletions([]);
                setSelectedIndex(-1);
              }}
            >
              {completion}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
