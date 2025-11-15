import { z } from 'zod';
import { Travel369Client } from '../../api/client.js';
import { UserRepository, BusStationRepository } from '../../db/repositories.js';
import { setApiToken } from './auth.js';
import { calcDistance, convertGeoToPoint } from '../../geo/converter.js';
import type { GeoPoint } from '../../geo/converter.js';

const userRepo = new UserRepository();
const stationRepo = new BusStationRepository();
const apiClient = new Travel369Client();

export const queryStationSchema = z.object({
  type: z.literal('query-station'),
  params: z.object({
    stationName: z.string().min(1),
  }),
});

export async function handleQueryStation(input: z.infer<typeof queryStationSchema>) {
  const { stationName } = input.params;

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
    const stations = stationRepo.findByStationName(stationName);
    
    if (stations.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              status: 'not_found',
              message: `未找到站点: ${stationName}`,
              hint: '请先使用 search-bus 和 subscribe-line 订阅相关线路',
            }, null, 2),
          },
        ],
      };
    }

    const results = [];

    for (const station of stations) {
      try {
        const lineInfo = await apiClient.getLineRealTimeInfo(station.line_id);
        const buses = await apiClient.getBussesByLineId(station.line_id);
        
        const nearbyBuses = buses.filter((bus) => {
          if (!bus.geo) return false;
          const busPoint = convertGeoToPoint(bus.geo);
          const stationPoint = convertGeoToPoint(station.geo || '');
          const distance = calcDistance(busPoint, stationPoint);
          return distance <= 5000;
        });

        const formattedBuses = nearbyBuses.map((bus) => {
          let distance = 0;
          let arrivalTime = 0;
          
          if (bus.geo && station.geo) {
            const busPoint = convertGeoToPoint(bus.geo);
            const stationPoint = convertGeoToPoint(station.geo);
            distance = calcDistance(busPoint, stationPoint);
            
            if (bus.velocity > 0) {
              arrivalTime = Math.round((distance / 1000) / bus.velocity * 60);
            }
          }

          return {
            name: bus.name,
            stationNo: bus.stationNo,
            velocity: bus.velocity,
            openAirCon: bus.openAirCon,
            distance: Math.round(distance),
            estimatedArrival: arrivalTime,
            ratio: bus.ratio,
          };
        });

        results.push({
          line: {
            id: station.line_id,
            name: station.line_name,
          },
          station: {
            id: station.station_id,
            name: station.station_name,
            stationNo: station.station_no,
          },
          buses: formattedBuses,
        });
      } catch (error) {
        console.error(`Error querying line ${station.line_id}:`, error);
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            stationName,
            results,
            summary: {
              totalLines: results.length,
              totalBuses: results.reduce((sum, r) => sum + r.buses.length, 0),
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
            message: error instanceof Error ? error.message : '查询站点失败',
          }, null, 2),
          },
        ],
      isError: true,
    };
  }
}

export const getLineRealtimeSchema = z.object({
  type: z.literal('get-line-realtime'),
  params: z.object({
    lineId: z.number(),
  }),
});

export async function handleGetLineRealtime(input: z.infer<typeof getLineRealtimeSchema>) {
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

    const formattedStations = lineInfo.stations.map((station) => ({
      id: station.stationId,
      name: station.name,
      stationNo: station.stationNo,
      tag: station.publicTag,
    }));

    const formattedBuses = lineInfo.busses.map((bus) => {
      let position: GeoPoint | null = null;
      
      if (bus.geo) {
        try {
          position = convertGeoToPoint(bus.geo);
        } catch (error) {
          console.error('Error decoding geo:', error);
        }
      }

      return {
        id: bus.busId,
        name: bus.name,
        stationNo: bus.stationNo,
        velocity: bus.velocity,
        openAirCon: bus.openAirCon,
        ratio: bus.ratio,
        position: position ? {
          lng: position.lng,
          lat: position.lat,
        } : null,
      };
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            line: {
              id: lineInfo.lineId,
              name: lineInfo.name,
              startStation: lineInfo.startStationName,
              endStation: lineInfo.endStationName,
              firstDeparture: lineInfo.firstDepartureTime,
              lastDeparture: lineInfo.lastDepartureTime,
            },
            stations: formattedStations,
            buses: formattedBuses,
            nextBus: lineInfo.nextBus ? {
              name: lineInfo.nextBus.name,
              planArrTime: lineInfo.nextBus.planArrTime,
            } : null,
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
            message: error instanceof Error ? error.message : '获取线路实时信息失败',
          }, null, 2),
          },
        ],
      isError: true,
    };
  }
}
