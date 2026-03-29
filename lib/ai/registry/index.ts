/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Agent Registry - Main Export
 *
 * Central export point for the AI agent registry system
 */

import {
  agentRegistry,
  registerAgent,
  executeAgentRequest,
  getAllAgents,
  getAgent,
  getAvailableAgents,
  hasAgent,
  unregisterAgent,
  getRegistryStats,
} from './core';

// Export core registry functions and compatibility object
export {
  agentRegistry,
  registerAgent,
  executeAgentRequest,
  getAllAgents,
  getAgent,
  getAvailableAgents,
  hasAgent,
  unregisterAgent,
  getRegistryStats,
};

// Export all types
export type { AgentSpecification, AgentContext, AgentRequest, AgentResponse } from './types';

// Export validation utilities
export {
  validateSpecification,
  validateRequest,
  validateSensitiveData,
  checkPermissions,
  validateContext,
} from './validation';

// Export context fetching
export { fetchContextData } from './context-fetcher';

// Export execution utilities
export {
  executeAgent as executeAgentCore,
  prepareContext,
  buildSystemPrompt,
  buildUserMessage,
  generateRequestId,
  hashInput,
} from './execution';

// Export analytics functions
export {
  getAnalytics,
  getDatabaseAnalytics,
  getPerformanceMetrics,
  logExecution,
  addToExecutionLog,
  clearExecutionLog,
} from './analytics';

// Helper function for easier agent execution (maintains backward compatibility)
export async function executeAgent(
  agentId: string,
  input: Record<string, any>,
  context: Partial<import('./types').AgentContext>,
  overrides?: import('./types').AgentRequest['overrides']
): Promise<import('./types').AgentResponse> {
  const fullContext: import('./types').AgentContext = {
    userId: context.userId || '',
    userRole: context.userRole || 'admin',
    sessionId: context.sessionId || `session_${Date.now()}`,
    requestId: `req_${Date.now()}`,
    timestamp: new Date(),
    currentPage: context.currentPage,
    entityId: context.entityId,
    entityType: context.entityType,
    contextData: context.contextData || {},
  };

  return executeAgentRequest({
    agentId,
    input,
    context: fullContext,
    overrides,
  });
}
