#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { initDatabase } from '../db/database.js';
import {
  scanLoginSchema,
  loginStatusSchema,
  handleScanLogin,
  handleLoginStatus,
} from './tools/auth.js';
import {
  searchBusSchema,
  subscribeLineSchema,
  unsubscribeLineSchema,
  listSubscriptionsSchema,
  handleSearchBus,
  handleSubscribeLine,
  handleUnsubscribeLine,
  handleListSubscriptions,
} from './tools/subscription.js';
import {
  queryStationSchema,
  getLineRealtimeSchema,
  handleQueryStation,
  handleGetLineRealtime,
} from './tools/query.js';

initDatabase();

const server = new Server(
  {
    name: 'travel369-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'scan-login',
        description: '扫码登录Travel369账号。action=request获取二维码，action=poll轮询登录状态',
        inputSchema: {
          type: 'object',
          properties: {
            type: { const: 'scan-login', type: 'string' },
            params: {
              type: 'object',
              properties: {
                action: {
                  type: 'string',
                  enum: ['request', 'poll'],
                  default: 'request',
                },
                scanId: {
                  type: 'string',
                  description: '扫码ID，用于轮询时使用',
                },
              },
            },
          },
          required: ['type'],
        },
      },
      {
        name: 'login-status',
        description: '查看当前登录状态',
        inputSchema: {
          type: 'object',
          properties: {
            type: { const: 'login-status', type: 'string' },
            params: { type: 'object', properties: {} },
          },
          required: ['type'],
        },
      },
      {
        name: 'search-bus',
        description: '搜索公交线路或站点',
        inputSchema: {
          type: 'object',
          properties: {
            type: { const: 'search-bus', type: 'string' },
            params: {
              type: 'object',
              properties: {
                keyword: {
                  type: 'string',
                  description: '搜索关键词，如"K93"或"火车站"',
                },
              },
              required: ['keyword'],
            },
          },
          required: ['type'],
        },
      },
      {
        name: 'subscribe-line',
        description: '订阅公交线路，将线路和站点信息保存到数据库',
        inputSchema: {
          type: 'object',
          properties: {
            type: { const: 'subscribe-line', type: 'string' },
            params: {
              type: 'object',
              properties: {
                lineId: {
                  type: 'number',
                  description: '线路ID，从search-bus结果中获取',
                },
              },
              required: ['lineId'],
            },
          },
          required: ['type'],
        },
      },
      {
        name: 'unsubscribe-line',
        description: '取消订阅公交线路',
        inputSchema: {
          type: 'object',
          properties: {
            type: { const: 'unsubscribe-line', type: 'string' },
            params: {
              type: 'object',
              properties: {
                lineId: {
                  type: 'number',
                  description: '线路ID',
                },
              },
              required: ['lineId'],
            },
          },
          required: ['type'],
        },
      },
      {
        name: 'list-subscriptions',
        description: '列出所有已订阅的公交线路',
        inputSchema: {
          type: 'object',
          properties: {
            type: { const: 'list-subscriptions', type: 'string' },
            params: { type: 'object', properties: {} },
          },
          required: ['type'],
        },
      },
      {
        name: 'query-station',
        description: '查询站点实时公交信息，根据站点名称查询关联的订阅线路的实时公交',
        inputSchema: {
          type: 'object',
          properties: {
            type: { const: 'query-station', type: 'string' },
            params: {
              type: 'object',
              properties: {
                stationName: {
                  type: 'string',
                  description: '站点名称',
                },
              },
              required: ['stationName'],
            },
          },
          required: ['type'],
        },
      },
      {
        name: 'get-line-realtime',
        description: '获取线路实时详细信息，包括所有站点和车辆位置',
        inputSchema: {
          type: 'object',
          properties: {
            type: { const: 'get-line-realtime', type: 'string' },
            params: {
              type: 'object',
              properties: {
                lineId: {
                  type: 'number',
                  description: '线路ID',
                },
              },
              required: ['lineId'],
            },
          },
          required: ['type'],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'scan-login':
        const scanLoginInput = scanLoginSchema.parse(args);
        return handleScanLogin(scanLoginInput);
      
      case 'login-status':
        const loginStatusInput = loginStatusSchema.parse(args);
        return handleLoginStatus();
      
      case 'search-bus':
        const searchBusInput = searchBusSchema.parse(args);
        return handleSearchBus(searchBusInput);
      
      case 'subscribe-line':
        const subscribeLineInput = subscribeLineSchema.parse(args);
        return handleSubscribeLine(subscribeLineInput);
      
      case 'unsubscribe-line':
        const unsubscribeLineInput = unsubscribeLineSchema.parse(args);
        return handleUnsubscribeLine(unsubscribeLineInput);
      
      case 'list-subscriptions':
        const listSubscriptionsInput = listSubscriptionsSchema.parse(args);
        return handleListSubscriptions();
      
      case 'query-station':
        const queryStationInput = queryStationSchema.parse(args);
        return handleQueryStation(queryStationInput);
      
      case 'get-line-realtime':
        const getLineRealtimeInput = getLineRealtimeSchema.parse(args);
        return handleGetLineRealtime(getLineRealtimeInput);
      
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Invalid arguments',
              details: error,
            }, null, 2),
          },
        ],
        isError: true,
      };
    }
    
    throw error;
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Travel369 MCP Server running');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
