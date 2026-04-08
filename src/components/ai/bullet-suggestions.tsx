"use client";

import { Check, Plus, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BulletSuggestion {
  id: string;
  text: string;
  selected: boolean;
}

interface BulletSuggestionsProps {
  suggestions: string[];
  onAccept: (_selectedBullets: string[]) => void;
  onReject: () => void;
  isLoading?: boolean;
}

export function BulletSuggestions({
  suggestions,
  onAccept,
  onReject,
  isLoading = false,
}: BulletSuggestionsProps) {
  const [bullets, setBullets] = useState<BulletSuggestion[]>(
    suggestions.map((text, index) => ({
      id: `bullet-${index}`,
      text,
      selected: true,
    }))
  );

  const toggleBullet = (id: string) => {
    setBullets(prev =>
      prev.map(bullet =>
        bullet.id === id ? { ...bullet, selected: !bullet.selected } : bullet
      )
    );
  };

  const handleAccept = () => {
    const selectedBullets = bullets
      .filter(bullet => bullet.selected)
      .map(bullet => bullet.text);
    onAccept(selectedBullets);
  };

  const addCustomBullet = () => {
    const newBullet = prompt("Enter a custom bullet point:");
    if (newBullet && newBullet.trim()) {
      setBullets(prev => [
        ...prev,
        {
          id: `bullet-custom-${Date.now()}`,
          text: newBullet.trim(),
          selected: true,
        },
      ]);
    }
  };

  if (isLoading) {
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            AI is generating bullet points...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-blue-700">
            This usually takes 10-15 seconds. Please wait...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-green-200 bg-green-50">
      <CardHeader>
        <CardTitle className="text-lg text-green-800">
          AI-Generated Bullet Points
        </CardTitle>
        <p className="text-sm text-green-600">
          Select the bullet points you&apos;d like to include in your resume:
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {bullets.map((bullet) => (
            <div
              key={bullet.id}
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                bullet.selected
                  ? "border-green-300 bg-green-100"
                  : "border-gray-200 bg-white hover:bg-gray-50"
              }`}
              onClick={() => toggleBullet(bullet.id)}
            >
              <div
                className={`w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 ${
                  bullet.selected
                    ? "border-green-600 bg-green-600"
                    : "border-gray-300"
                }`}
              >
                {bullet.selected && <Check className="w-3 h-3 text-white" />}
              </div>
              <p className="text-sm flex-1">{bullet.text}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={addCustomBullet}
            className="flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            Add Custom
          </Button>
        </div>

        <div className="flex gap-2 pt-4 border-t">
          <Button
            onClick={handleAccept}
            disabled={bullets.filter(b => b.selected).length === 0}
            className="flex-1"
          >
            Accept {bullets.filter(b => b.selected).length} Selected
          </Button>
          <Button variant="outline" onClick={onReject}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
