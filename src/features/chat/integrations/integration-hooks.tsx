"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Link2, 
  Calendar, 
  FileText, 
  Video, 
  Code, 
  Github, 
  Slack, 
  Google,
  Microsoft,
  Zap,
  Settings,
  CheckCircle,
  AlertTriangle,
  Plus,
  ExternalLink
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Switch } from "../../components/ui/switch";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";

interface ChatIntegration {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  category: 'productivity' | 'development' | 'communication' | 'education';
  status: 'connected' | 'disconnected' | 'error';
  features: string[];
  config?: Record<string, any>;
  lastSync?: string;
  usageCount?: number;
}

interface IntegrationHook {
  id: string;
  name: string;
  description: string;
  trigger: 'message_sent' | 'thread_created' | 'user_mentioned' | 'file_shared';
  action: string;
  integrationId: string;
  isActive: boolean;
  config?: Record<string, any>;
}

interface ChatIntegrationsProps {
  currentUserId: string;
  threadId?: string;
  conversationId?: string;
}

export function ChatIntegrations({ currentUserId, threadId, conversationId }: ChatIntegrationsProps) {
  const [integrations, setIntegrations] = useState<ChatIntegration[]>([]);
  const [hooks, setHooks] = useState<IntegrationHook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  useEffect(() => {
    const fetchIntegrations = async () => {
      setIsLoading(true);
      try {
        // Mock integrations data
        const mockIntegrations: ChatIntegration[] = [
          {
            id: 'google-calendar',
            name: 'Google Calendar',
            description: 'Sync chat events with your calendar',
            icon: Calendar,
            category: 'productivity',
            status: 'connected',
            features: ['Event creation', 'Meeting scheduling', 'Reminders'],
            lastSync: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
            usageCount: 47
          },
          {
            id: 'github',
            name: 'GitHub',
            description: 'Link code discussions and repositories',
            icon: Github,
            category: 'development',
            status: 'connected',
            features: ['Issue linking', 'PR discussions', 'Code snippets'],
            lastSync: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
            usageCount: 23
          },
          {
            id: 'slack',
            name: 'Slack',
            description: 'Cross-platform messaging integration',
            icon: Slack,
            category: 'communication',
            status: 'disconnected',
            features: ['Message forwarding', 'Channel sync', 'User mapping'],
            usageCount: 0
          },
          {
            id: 'notion',
            name: 'Notion',
            description: 'Save chat content to Notion databases',
            icon: FileText,
            category: 'productivity',
            status: 'connected',
            features: ['Page creation', 'Database updates', 'Templates'],
            lastSync: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
            usageCount: 15
          },
          {
            id: 'zoom',
            name: 'Zoom',
            description: 'Schedule and join meetings from chat',
            icon: Video,
            category: 'communication',
            status: 'disconnected',
            features: ['Meeting scheduling', 'One-click join', 'Recordings'],
            usageCount: 0
          },
          {
            id: 'codepen',
            name: 'CodePen',
            description: 'Share and discuss code snippets',
            icon: Code,
            category: 'development',
            status: 'connected',
            features: ['Embed pens', 'Live preview', 'Fork discussions'],
            lastSync: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
            usageCount: 8
          }
        ];

        const mockHooks: IntegrationHook[] = [
          {
            id: 'hook1',
            name: 'Create calendar event',
            description: 'Create Google Calendar event when meeting is scheduled',
            trigger: 'message_sent',
            action: 'create_calendar_event',
            integrationId: 'google-calendar',
            isActive: true,
            config: {
              keywords: ['meeting', 'schedule', 'call'],
              defaultDuration: 60
            }
          },
          {
            id: 'hook2',
            name: 'Create GitHub issue',
            description: 'Create GitHub issue for bug reports',
            trigger: 'message_sent',
            action: 'create_issue',
            integrationId: 'github',
            isActive: true,
            config: {
              keywords: ['bug', 'issue', 'problem'],
              repository: 'main-project',
              labels: ['chat-discussion']
            }
          },
          {
            id: 'hook3',
            name: 'Save to Notion',
            description: 'Save important messages to Notion',
            trigger: 'user_mentioned',
            action: 'create_page',
            integrationId: 'notion',
            isActive: false,
            config: {
              databaseId: 'important-discussions',
              template: 'meeting-notes'
            }
          }
        ];

        setIntegrations(mockIntegrations);
        setHooks(mockHooks);
      } catch (error) {
        console.error('Failed to fetch integrations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchIntegrations();
  }, []);

  const handleIntegrationToggle = async (integrationId: string, connect: boolean) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setIntegrations(prev => 
        prev.map(integration => 
          integration.id === integrationId
            ? { 
                ...integration, 
                status: connect ? 'connected' : 'disconnected',
                lastSync: connect ? new Date().toISOString() : undefined
              }
            : integration
        )
      );
    } catch (error) {
      console.error('Failed to toggle integration:', error);
    }
  };

  const handleHookToggle = async (hookId: string, active: boolean) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setHooks(prev => 
        prev.map(hook => 
          hook.id === hookId ? { ...hook, isActive: active } : hook
        )
      );
    } catch (error) {
      console.error('Failed to toggle hook:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-100 text-green-800';
      case 'disconnected': return 'bg-gray-100 text-gray-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'disconnected': return <AlertTriangle className="w-4 h-4 text-gray-500" />;
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default: return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  const categories = [
    { id: 'all', name: 'All Integrations' },
    { id: 'productivity', name: 'Productivity' },
    { id: 'development', name: 'Development' },
    { id: 'communication', name: 'Communication' },
    { id: 'education', name: 'Education' }
  ];

  const filteredIntegrations = activeCategory === 'all' 
    ? integrations 
    : integrations.filter(i => i.category === activeCategory);

  const IntegrationCard = ({ integration }: { integration: ChatIntegration }) => {
    const Icon = integration.icon;
    const isConnected = integration.status === 'connected';

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-sm font-medium">{integration.name}</CardTitle>
                <p className="text-xs text-gray-500">{integration.description}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusIcon(integration.status)}
              <Switch
                checked={isConnected}
                onCheckedChange={(checked) => handleIntegrationToggle(integration.id, checked)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {/* Features */}
            <div className="flex flex-wrap gap-1">
              {integration.features.map((feature, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {feature}
                </Badge>
              ))}
            </div>

            {/* Status and Usage */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center space-x-2">
                <Badge className={getStatusColor(integration.status)}>
                  {integration.status}
                </Badge>
                {integration.lastSync && (
                  <span>Last sync: {new Date(integration.lastSync).toLocaleDateString()}</span>
                )}
              </div>
              {integration.usageCount !== undefined && (
                <span>{integration.usageCount} uses</span>
              )}
            </div>

            {/* Actions */}
            {isConnected && (
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" className="text-xs">
                  <Settings className="w-3 h-3 mr-1" />
                  Configure
                </Button>
                <Button variant="outline" size="sm" className="text-xs">
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Open
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const HookCard = ({ hook }: { hook: IntegrationHook }) => {
    const integration = integrations.find(i => i.id === hook.integrationId);
    const IntegrationIcon = integration?.icon || Link2;

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-2">
                <IntegrationIcon className="w-4 h-4 text-gray-600" />
                <h4 className="font-medium text-sm truncate">{hook.name}</h4>
              </div>
              <p className="text-xs text-gray-600 mb-3">{hook.description}</p>
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <Badge variant="outline" className="text-xs">
                  {hook.trigger.replace('_', ' ')}
                </Badge>
                <span>via {integration?.name}</span>
              </div>
            </div>
            <Switch
              checked={hook.isActive}
              onCheckedChange={(checked) => handleHookToggle(hook.id, checked)}
              className="ml-2"
            />
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Link2 className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold">Chat Integrations</h2>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Integration
        </Button>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Connected</p>
                <p className="text-2xl font-bold">
                  {integrations.filter(i => i.status === 'connected').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Hooks</p>
                <p className="text-2xl font-bold">
                  {hooks.filter(h => h.isActive).length}
                </p>
              </div>
              <Zap className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Uses</p>
                <p className="text-2xl font-bold">
                  {integrations.reduce((sum, i) => sum + (i.usageCount || 0), 0)}
                </p>
              </div>
              <Settings className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Available</p>
                <p className="text-2xl font-bold">
                  {integrations.filter(i => i.status === 'disconnected').length}
                </p>
              </div>
              <Plus className="w-8 h-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="integrations" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="hooks">Automation Hooks</TabsTrigger>
        </TabsList>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-4">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <Button
                key={category.id}
                variant={activeCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCategory(category.id)}
                className="text-xs"
              >
                {category.name}
              </Button>
            ))}
          </div>

          {/* Integration Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredIntegrations.map(integration => (
              <IntegrationCard key={integration.id} integration={integration} />
            ))}
          </div>
        </TabsContent>

        {/* Hooks Tab */}
        <TabsContent value="hooks" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Automation Hooks</h3>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Create Hook
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {hooks.map(hook => (
              <HookCard key={hook.id} hook={hook} />
            ))}
          </div>

          {hooks.length === 0 && (
            <div className="text-center py-8">
              <Zap className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No automation hooks</h3>
              <p className="text-gray-500">
                Create hooks to automate actions based on chat events
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Hook for triggering integrations from chat components
export function useIntegrationTriggers({
  threadId,
  conversationId,
  currentUserId
}: {
  threadId?: string;
  conversationId?: string;
  currentUserId: string;
}) {
  const [isTriggering, setIsTriggering] = useState(false);

  const triggerIntegration = useCallback(async (
    integrationId: string,
    action: string,
    data: any
  ) => {
    setIsTriggering(true);
    try {
      // Simulate API call to trigger integration
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log(`Triggered ${integrationId} with action ${action}:`, data);
      
      // In a real implementation, this would call the integration's API
      return { success: true };
    } catch (error) {
      console.error('Failed to trigger integration:', error);
      return { success: false, error };
    } finally {
      setIsTriggering(false);
    }
  }, []);

  const createCalendarEvent = useCallback(async (eventData: {
    title: string;
    description?: string;
    startTime: Date;
    duration: number;
    attendees?: string[];
  }) => {
    return triggerIntegration('google-calendar', 'create_event', eventData);
  }, [triggerIntegration]);

  const createGitHubIssue = useCallback(async (issueData: {
    title: string;
    description: string;
    repository?: string;
    labels?: string[];
  }) => {
    return triggerIntegration('github', 'create_issue', issueData);
  }, [triggerIntegration]);

  const saveToNotion = useCallback(async (pageData: {
    title: string;
    content: string;
    databaseId?: string;
    properties?: Record<string, any>;
  }) => {
    return triggerIntegration('notion', 'create_page', pageData);
  }, [triggerIntegration]);

  return {
    isTriggering,
    triggerIntegration,
    createCalendarEvent,
    createGitHubIssue,
    saveToNotion
  };
}
