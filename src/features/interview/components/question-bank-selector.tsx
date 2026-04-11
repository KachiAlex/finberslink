'use client';

import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Checkbox } from "../../../components/ui/checkbox";
import { AlertCircle, Loader2, Plus, Trash2 } from 'lucide-react';
import { Alert, AlertDescription } from "../../../components/ui/alert";

interface QuestionTemplate {
  id: string;
  text: string;
  targetRole: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: number;
  rubric?: string;
}

interface QuestionBankSelectorProps {
  selectedRole?: string;
  onRoleChange: (role: string) => void;
  onQuestionsSelect: (questions: QuestionTemplate[]) => void;
  selectedQuestions?: QuestionTemplate[];
}

const DIFFICULTY_COLORS = {
  easy: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  hard: 'bg-red-100 text-red-800',
};

export function QuestionBankSelector({
  selectedRole,
  onRoleChange,
  onQuestionsSelect,
  selectedQuestions = [],
}: QuestionBankSelectorProps) {
  const [roles, setRoles] = useState<string[]>([]);
  const [questions, setQuestions] = useState<QuestionTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(selectedQuestions.map((q) => q.id))
  );
  const [customQuestions, setCustomQuestions] = useState<QuestionTemplate[]>([]);
  const [showCustomForm, setShowCustomForm] = useState(false);

  // Fetch available roles on mount
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await fetch('/api/interview/question-templates');
        if (!response.ok) throw new Error('Failed to fetch roles');
        const data = await response.json();
        // Extract unique roles from templates
        const uniqueRoles = [...new Set(data.templates?.map((t: QuestionTemplate) => t.targetRole) || [])];
        setRoles(uniqueRoles.sort());
      } catch (err) {
        console.error('Error fetching roles:', err);
        setError('Failed to load available roles');
      }
    };

    fetchRoles();
  }, []);

  // Fetch questions when role changes
  useEffect(() => {
    if (!selectedRole) {
      setQuestions([]);
      return;
    }

    const fetchQuestions = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/interview/question-templates/by-role/${selectedRole}`);
        if (!response.ok) {
          if (response.status === 404) {
            setQuestions([]);
            return;
          }
          throw new Error('Failed to fetch questions');
        }
        const data = await response.json();
        setQuestions(data.questions || []);
        // Reset selection when role changes
        setSelectedIds(new Set());
      } catch (err) {
        console.error('Error fetching questions:', err);
        setError('Failed to load questions for this role');
        setQuestions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [selectedRole]);

  // Update parent when selected questions change
  useEffect(() => {
    const selected = questions.filter((q) => selectedIds.has(q.id));
    const allSelected = [...selected, ...customQuestions];
    onQuestionsSelect(allSelected);
  }, [selectedIds, customQuestions, questions, onQuestionsSelect]);

  const handleQuestionToggle = (questionId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(questionId)) {
      newSelected.delete(questionId);
    } else {
      newSelected.add(questionId);
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === questions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(questions.map((q) => q.id)));
    }
  };

  const handleRemoveCustomQuestion = (index: number) => {
    setCustomQuestions(customQuestions.filter((_, i) => i !== index));
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m`;
  };

  const allQuestions = [...questions, ...customQuestions];
  const totalTime = allQuestions
    .filter((q) => selectedIds.has(q.id) || customQuestions.includes(q))
    .reduce((sum, q) => sum + q.estimatedTime, 0);

  return (
    <div className="space-y-6">
      {/* Role Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Interview Role</CardTitle>
          <CardDescription>Choose the role you want to practice for</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedRole || ''} onValueChange={onRoleChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select a role..." />
            </SelectTrigger>
            <SelectContent>
              {roles.map((role) => (
                <SelectItem key={role} value={role}>
                  {role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Questions Selection */}
      {selectedRole && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Select Questions</CardTitle>
                <CardDescription>
                  {selectedIds.size} of {questions.length} selected
                  {totalTime > 0 && ` • Total time: ${formatTime(totalTime)}`}
                </CardDescription>
              </div>
              {questions.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                >
                  {selectedIds.size === questions.length ? 'Deselect All' : 'Select All'}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {!loading && questions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No questions available for this role yet.
              </div>
            )}

            {!loading && questions.length > 0 && (
              <div className="space-y-3">
                {questions.map((question) => (
                  <div
                    key={question.id}
                    className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      id={question.id}
                      checked={selectedIds.has(question.id)}
                      onCheckedChange={() => handleQuestionToggle(question.id)}
                      className="mt-1"
                      aria-label={`Select question: ${question.text}`}
                    />
                    <div className="flex-1 min-w-0">
                      <label
                        htmlFor={question.id}
                        className="text-sm font-medium leading-relaxed cursor-pointer block"
                      >
                        {question.text}
                      </label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs">
                          {question.category}
                        </Badge>
                        <Badge
                          className={`text-xs ${DIFFICULTY_COLORS[question.difficulty]}`}
                          variant="outline"
                        >
                          {question.difficulty}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {formatTime(question.estimatedTime)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Custom Questions */}
      {selectedRole && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Custom Questions</CardTitle>
                <CardDescription>
                  {customQuestions.length} custom question{customQuestions.length !== 1 ? 's' : ''}
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCustomForm(!showCustomForm)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Custom
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {customQuestions.length > 0 && (
              <div className="space-y-3">
                {customQuestions.map((question, index) => (
                  <div
                    key={`custom-${index}`}
                    className="flex items-start space-x-3 p-3 border rounded-lg bg-blue-50"
                  >
                    <Checkbox
                      checked={selectedIds.has(question.id)}
                      onCheckedChange={() => handleQuestionToggle(question.id)}
                      className="mt-1"
                      aria-label={`Select custom question: ${question.text}`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-relaxed">{question.text}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs">
                          Custom
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {formatTime(question.estimatedTime)}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveCustomQuestion(index)}
                      aria-label={`Remove custom question: ${question.text}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {showCustomForm && (
              <div className="p-4 border rounded-lg bg-muted/50 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Add your own custom question for this interview.
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowCustomForm(false)}
                >
                  Close Form
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      {selectedRole && (
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{selectedIds.size + customQuestions.length}</p>
                <p className="text-sm text-muted-foreground">Questions Selected</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{formatTime(totalTime)}</p>
                <p className="text-sm text-muted-foreground">Total Time</p>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {Math.ceil(totalTime / 60)}
                </p>
                <p className="text-sm text-muted-foreground">Minutes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
