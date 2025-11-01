import { z } from 'zod';
import { Travel369Client } from '../../api/client.js';
import { UserRepository, BusLineRepository, BusStationRepository } from '../../db/repositories.js';
import { setApiToken } from './auth.js';

const userRepo = new UserRepository();
const lineRepo = new BusLineRepository();
const stationRepo = new BusStationRepository();
const apiClient = new Travel369Client();

export const searchBusSchema = z.object({
  type: z.literal('search-bus'),
  params: z.object({
    keyword: z.string().min(1),
  }),
});

export async function handleSearchBus(input: z.infer<typeof searchBusSchema>) {
  const { keyword } = input.params;

  const user = userRepo.findByToken(apiClient['token'] || '');
  if (!user) {
    return {
      content: [
        {
          type: 'text',
          text: '请先使用 scan-login 工具登录',
        },
      ],
      isError: true,
    };
  }

  setApiToken(user.token);

  try {
    const results = await apiClient.search(keyword);
    
    const formattedResults = results.result.map((item) => {
      if (item.type === 1) {
        return {
          type: 'line',
          name: item.text1,
          route: item.text2,
          status: item.text3,
          waitTime: item.waitTime,
          guid: item.guid,
        };
      } else {
        return {
          type: 'station',
          name: item.text1,
          description: item.text2,
          info: item.text3,
          guid: item.guid,
        };
      }
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            keyword,
            results: formattedResults,
            refresh: results.refresh,
          }, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            status: 'error',
            message: error instanceof Error ? error.message : '搜索失败',
          }, null, 2),
          },
        ],
      isError: true,
    };
  }
}

export const subscribeLineSchema = z.object({
  type: z.literal('subscribe-line'),
  params: z.object({
    lineId: z.number(),
  }),
});

export async function handleSubscribeLine(input: z.infer<typeof subscribeLineSchema>) {
  const { lineId } = input.params;

  const user = userRepo.findByToken(apiClient['token'] || '');
  if (!user) {
    return {
      content: [
        {
          type: 'text',
          text: '请先使用 scan-login 工具登录',
        },
      ],
      isError: true,
    };
  }

  setApiToken(user.token);

  try {
    const lineInfo = await apiClient.getLineRealTimeInfo(lineId);
    
    const busLine = lineRepo.subscribe(user.id, lineInfo);
    stationRepo.upsert(busLine.id, lineInfo.stations);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            status: 'success',
            message: `成功订阅线路: ${lineInfo.name}`,
            line: {
              id: busLine.id,
              name: lineInfo.name,
              startStation: lineInfo.startStationName,
              endStation: lineInfo.endStationName,
              stationCount: lineInfo.stations.length,
            },
          }, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            status: 'error',
            message: error instanceof Error ? error.message : '订阅线路失败',
          }, null, 2),
          },
        ],
      isError: true,
    };
  }
}

export const unsubscribeLineSchema = z.object({
  type: z.literal('unsubscribe-line'),
  params: z.object({
    lineId: z.number(),
  }),
});

export async function handleUnsubscribeLine(input: z.infer<typeof unsubscribeLineSchema>) {
  const { lineId } = input.params;

  const user = userRepo.findByToken(apiClient['token'] || '');
  if (!user) {
    return {
      content: [
        {
          type: 'text',
          text: '请先使用 scan-login 工具登录',
        },
      ],
      isError: true,
    };
  }

  try {
    const success = lineRepo.unsubscribe(user.id, lineId);
    
    if (success) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              status: 'success',
              message: '取消订阅成功',
            }, null, 2),
          },
        ],
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            status: 'error',
            message: '未找到该线路订阅',
          }, null, 2),
          },
        ],
      isError: true,
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            status: 'error',
            message: error instanceof Error ? error.message : '取消订阅失败',
          }, null, 2),
          },
        ],
      isError: true,
    };
  }
}

export const listSubscriptionsSchema = z.object({
  type: z.literal('list-subscriptions'),
  params: z.object({}),
});

export async function handleListSubscriptions() {
  const user = userRepo.findByToken(apiClient['token'] || '');
  if (!user) {
    return {
      content: [
        {
          type: 'text',
          text: '请先使用 scan-login 工具登录',
        },
      ],
      isError: true,
    };
  }

  try {
    const lines = lineRepo.findAllByUserId(user.id);

    const lineDetails = lines.map((line) => {
      const stations = stationRepo.findByLineId(line.id);
      return {
        id: line.id,
        lineId: line.line_id,
        name: line.line_name,
        startStation: line.start_station,
        endStation: line.end_station,
        stationCount: stations.length,
        subscribedAt: line.subscribed_at,
      };
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            status: 'success',
            user: {
              nickname: user.nickname,
              phone: user.phone,
            },
            subscriptions: lineDetails,
          }, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            status: 'error',
            message: error instanceof Error ? error.message : '获取订阅列表失败',
          }, null, 2),
          },
        ],
      isError: true,
    };
  }
}
