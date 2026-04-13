"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Smile, 
  Heart, 
  ThumbsUp, 
  Laugh, 
  Surprised, 
  Sad, 
  Angry,
  Star,
  Fire,
  Party,
  Coffee,
  Pizza,
  Music,
  Camera,
  Gift,
  Trophy,
  Zap,
  Sparkles,
  Search,
  Grid,
  Clock,
  Bookmark,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getStickers } from "../service";
import { useChatMessages } from "@/hooks";

interface CustomEmoji {
  id: string;
  name: string;
  url: string;
  category: string;
  isCustom: boolean;
  createdBy?: string;
  usageCount?: number;
  createdAt?: string;
}

interface Sticker {
  id: string;
  name: string;
  url: string;
  thumbnailUrl: string;
  category: string;
  isCustom: boolean;
  createdBy?: string;
  usageCount?: number;
  createdAt?: string;
}

interface EmojiStickerPickerProps {
  onSelectEmoji: (emoji: string) => void;
  onSelectSticker: (sticker: Sticker) => void;
  onAddCustomEmoji?: (emoji: Omit<CustomEmoji, 'id' | 'createdAt'>) => void;
  onAddCustomSticker?: (sticker: Omit<Sticker, 'id' | 'createdAt'>) => void;
  currentUserId: string;
  showStickers?: boolean;
  maxCustomEmojis?: number;
}

export function EmojiStickerPicker({
  onSelectEmoji,
  onSelectSticker,
  onAddCustomEmoji,
  onAddCustomSticker,
  currentUserId,
  showStickers = true,
  maxCustomEmojis = 50
}: EmojiStickerPickerProps) {
  const [activeTab, setActiveTab] = useState('emoji');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [customEmojis, setCustomEmojis] = useState<CustomEmoji[]>([]);
  const [customStickers, setCustomStickers] = useState<Sticker[]>([]);
  const [recentEmojis, setRecentEmojis] = useState<string[]>([]);
  const [showAddCustom, setShowAddCustom] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Default emojis
  const defaultEmojis = [
    { emoji: 'thumbsup', icon: ThumbsUp, category: 'reaction' },
    { emoji: 'heart', icon: Heart, category: 'emotion' },
    { emoji: 'laugh', icon: Laugh, category: 'emotion' },
    { emoji: 'wow', icon: Surprised, category: 'emotion' },
    { emoji: 'sad', icon: Sad, category: 'emotion' },
    { emoji: 'angry', icon: Angry, category: 'emotion' },
    { emoji: 'star', icon: Star, category: 'symbol' },
    { emoji: 'fire', icon: Fire, category: 'symbol' },
    { emoji: 'party', icon: Party, category: 'celebration' },
    { emoji: 'coffee', icon: Coffee, category: 'food' },
    { emoji: 'pizza', icon: Pizza, category: 'food' },
    { emoji: 'music', icon: Music, category: 'activity' },
    { emoji: 'camera', icon: Camera, category: 'activity' },
    { emoji: 'gift', icon: Gift, category: 'celebration' },
    { emoji: 'trophy', icon: Trophy, category: 'achievement' },
    { emoji: 'zap', icon: Zap, category: 'symbol' },
    { emoji: 'sparkles', icon: Sparkles, category: 'symbol' }
  ];

  // Mock custom emojis and stickers
  useEffect(() => {
    const mockCustomEmojis: CustomEmoji[] = [
      {
        id: 'custom1',
        name: 'celebration',
        url: '/emojis/custom-celebration.png',
        category: 'custom',
        isCustom: true,
        createdBy: 'user1',
        usageCount: 45,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'custom2',
        name: 'thinking',
        url: '/emojis/custom-thinking.png',
        category: 'custom',
        isCustom: true,
        createdBy: 'user2',
        usageCount: 32,
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    const mockCustomStickers: Sticker[] = [
      {
        id: 'sticker1',
        name: 'happy-cat',
        url: '/stickers/happy-cat.png',
        thumbnailUrl: '/stickers/thumbnails/happy-cat.png',
        category: 'animals',
        isCustom: true,
        createdBy: 'user1',
        usageCount: 67,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'sticker2',
        name: 'coffee-break',
        url: '/stickers/coffee-break.png',
        thumbnailUrl: '/stickers/thumbnails/coffee-break.png',
        category: 'lifestyle',
        isCustom: false,
        usageCount: 89,
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'sticker3',
        name: 'study-time',
        url: '/stickers/study-time.png',
        thumbnailUrl: '/stickers/thumbnails/study-time.png',
        category: 'education',
        isCustom: true,
        createdBy: 'user3',
        usageCount: 23,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    setCustomEmojis(mockCustomEmojis);
    setCustomStickers(mockCustomStickers);
  }, []);

  // Load recent emojis from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('recentEmojis');
    if (stored) {
      setRecentEmojis(JSON.parse(stored));
    }
  }, []);

  const addToRecent = (emoji: string) => {
    const updated = [emoji, ...recentEmojis.filter(e => e !== emoji)].slice(0, 20);
    setRecentEmojis(updated);
    localStorage.setItem('recentEmojis', JSON.stringify(updated));
  };

  const handleEmojiSelect = (emoji: string) => {
    onSelectEmoji(emoji);
    addToRecent(emoji);
  };

  const handleStickerSelect = (sticker: Sticker) => {
    onSelectSticker(sticker);
    // Increment usage count (in real app, this would be an API call)
    setCustomStickers(prev => 
      prev.map(s => 
        s.id === sticker.id 
          ? { ...s, usageCount: (s.usageCount || 0) + 1 }
          : s
      )
    );
  };

  const handleAddCustomEmoji = (file: File) => {
    if (!onAddCustomEmoji) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const newEmoji: Omit<CustomEmoji, 'id' | 'createdAt'> = {
        name: file.name.split('.')[0],
        url: e.target?.result as string,
        category: 'custom',
        isCustom: true,
        createdBy: currentUserId
      };

      if (customEmojis.length < maxCustomEmojis) {
        onAddCustomEmoji(newEmoji);
        setCustomEmojis(prev => [...prev, { ...newEmoji, id: `custom_${Date.now()}` }]);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddCustomSticker = (file: File) => {
    if (!onAddCustomSticker) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const newSticker: Omit<Sticker, 'id' | 'createdAt'> = {
        name: file.name.split('.')[0],
        url: e.target?.result as string,
        thumbnailUrl: e.target?.result as string, // In real app, generate thumbnail
        category: 'custom',
        isCustom: true,
        createdBy: currentUserId
      };

      onAddCustomSticker(newSticker);
      setCustomStickers(prev => [...prev, { ...newSticker, id: `sticker_${Date.now()}` }]);
    };
    reader.readAsDataURL(file);
  };

  const getEmojiCategories = () => {
    const categories = ['all', ...new Set(defaultEmojis.map(e => e.category))];
    if (customEmojis.length > 0) categories.push('custom');
    return categories;
  };

  const getStickerCategories = () => {
    const categories = ['all', ...new Set(customStickers.map(s => s.category))];
    return categories;
  };

  const filteredEmojis = defaultEmojis.filter(emoji => {
    const matchesCategory = selectedCategory === 'all' || emoji.category === selectedCategory;
    const matchesSearch = !searchQuery || emoji.emoji.includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const filteredCustomEmojis = customEmojis.filter(emoji => {
    const matchesCategory = selectedCategory === 'all' || selectedCategory === 'custom';
    const matchesSearch = !searchQuery || emoji.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const filteredStickers = customStickers.filter(sticker => {
    const matchesCategory = selectedCategory === 'all' || sticker.category === selectedCategory;
    const matchesSearch = !searchQuery || sticker.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const EmojiGrid = ({ emojis, showUsage = false }: { emojis: any[], showUsage?: boolean }) => (
    <div className="grid grid-cols-6 md:grid-cols-8 gap-2">
      {emojis.map((emoji, index) => (
        <Button
          key={index}
          variant="ghost"
          size="sm"
          onClick={() => {
            if (emoji.emoji) {
              handleEmojiSelect(emoji.emoji);
            } else if (emoji.url) {
              handleEmojiSelect(emoji.url);
            }
          }}
          className="h-10 w-10 p-0 hover:bg-gray-100 relative group"
        >
          {emoji.icon ? (
            <emoji.icon className="w-5 h-5" />
          ) : (
            <img src={emoji.url} alt={emoji.name} className="w-6 h-6" />
          )}
          {showUsage && emoji.usageCount && (
            <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              {emoji.usageCount > 99 ? '99+' : emoji.usageCount}
            </div>
          )}
        </Button>
      ))}
    </div>
  );

  const StickerGrid = ({ stickers }: { stickers: Sticker[] }) => (
    <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
      {stickers.map((sticker) => (
        <Card 
          key={sticker.id}
          className="cursor-pointer hover:shadow-md transition-shadow group"
          onClick={() => handleStickerSelect(sticker)}
        >
          <CardContent className="p-2">
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-2">
              <img 
                src={sticker.thumbnailUrl} 
                alt={sticker.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            </div>
            <p className="text-xs text-center truncate">{sticker.name}</p>
            {sticker.usageCount && (
              <div className="flex items-center justify-center mt-1">
                <span className="text-xs text-gray-500">{sticker.usageCount} uses</span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="w-80 bg-white border border-gray-200 rounded-lg shadow-lg">
      {/* Header */}
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Smile className="w-5 h-5 text-gray-600" />
          <Input
            placeholder="Search emojis..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 m-2">
          <TabsTrigger value="emoji" className="text-sm">Emojis</TabsTrigger>
          {showStickers && (
            <TabsTrigger value="sticker" className="text-sm">Stickers</TabsTrigger>
          )}
        </TabsList>

        {/* Emoji Tab */}
        <TabsContent value="emoji" className="mt-0">
          <div className="p-3">
            {/* Category Filter */}
            <div className="flex flex-wrap gap-1 mb-3">
              {getEmojiCategories().map(category => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="text-xs h-6"
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Button>
              ))}
            </div>

            {/* Recent Emojis */}
            {recentEmojis.length > 0 && selectedCategory === 'all' && (
              <div className="mb-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Recent</span>
                </div>
                <EmojiGrid emojis={recentEmojis.map(emoji => ({ emoji }))} />
              </div>
            )}

            {/* Default Emojis */}
            {filteredEmojis.length > 0 && (
              <div className="mb-4">
                <EmojiGrid emojis={filteredEmojis} />
              </div>
            )}

            {/* Custom Emojis */}
            {filteredCustomEmojis.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-medium text-gray-700">Custom</span>
                  </div>
                  {onAddCustomEmoji && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add
                    </Button>
                  )}
                </div>
                <EmojiGrid emojis={filteredCustomEmojis} showUsage={true} />
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleAddCustomEmoji(file);
              }}
              className="hidden"
            />
          </div>
        </TabsContent>

        {/* Sticker Tab */}
        {showStickers && (
          <TabsContent value="sticker" className="mt-0">
            <div className="p-3">
              {/* Category Filter */}
              <div className="flex flex-wrap gap-1 mb-3">
                {getStickerCategories().map(category => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className="text-xs h-6"
                  >
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </Button>
                ))}
              </div>

              {/* Add Custom Sticker */}
              {onAddCustomSticker && (
                <div className="mb-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Custom Sticker
                  </Button>
                </div>
              )}

              {/* Stickers Grid */}
              <ScrollArea className="h-64">
                {filteredStickers.length > 0 ? (
                  <StickerGrid stickers={filteredStickers} />
                ) : (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Smile className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500">
                      No stickers found
                    </p>
                  </div>
                )}
              </ScrollArea>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleAddCustomSticker(file);
                }}
                className="hidden"
              />
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
