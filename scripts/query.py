#!/usr/bin/env python3
"""
济南公交 (出行369) 查询模块
查询公交实时位置、到站时间、线路站点
"""

import requests
import json
import os
import sys
import argparse
from login import get_valid_token

BASE_URL = "https://api.369cx.cn"
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"


def get_headers():
    """获取带 token 的请求头"""
    token = get_valid_token()
    if not token:
        raise Exception("需要先登录获取 token")
    
    if not token.startswith("Bearer "):
        token = f"Bearer {token}"
    
    return {
        "User-Agent": USER_AGENT,
        "Authorization": token,
        "Content-Type": "application/json"
    }


def search(keyword):
    """搜索公交线路或站点"""
    headers = get_headers()
    resp = requests.post(
        f"{BASE_URL}/v2/Search",
        headers=headers,
        json={"keyword": keyword}
    )
    data = resp.json()
    if data.get("status", {}).get("code") == 0:
        return data.get("result", {}).get("result", [])
    return []


def get_line_info(line_id):
    """获取线路详细信息（含站点和车辆）"""
    headers = get_headers()
    resp = requests.get(
        f"{BASE_URL}/v2/Line/GetRealTimeLineInfo/{line_id}",
        headers=headers
    )
    data = resp.json()
    if data.get("status", {}).get("code") == 0:
        return data.get("result", {})
    return {}


def query_bus(line_name, station_name=None, show_stops=False):
    """
    查询公交信息
    
    Args:
        line_name: 线路名称，如 "K93"、"163"
        station_name: 可选，查询到达某站的来车时间
        show_stops: 是否显示线路站点
    """
    # 1. 搜索线路
    results = search(line_name)
    
    lines = [r for r in results if r.get("type") == 1 and line_name.upper() in r.get("text1", "").upper()]
    
    if not lines:
        return f"❌ 未找到线路: {line_name}"
    
    output = []
    
    for line in lines[:2]:  # 最多显示2个方向
        line_id = line.get("guid", "")
        line_text = line.get("text1", "")
        direction = line.get("text2", "")
        
        info = get_line_info(line_id)
        if not info:
            continue
        
        name = info.get("name", line_text)
        start = info.get("startStationName", "?")
        end = info.get("endStationName", "?")
        first = info.get("firstDepartureTime", "?")
        last = info.get("lastDepartureTime", "?")
        
        stations = info.get("stations", [])
        station_map = {s["stationNo"]: s["name"] for s in stations}
        buses = info.get("busses", [])
        
        output.append(f"")
        output.append(f"【{name}】{direction}")
        output.append(f"路线: {start} → {end}")
        output.append(f"首班: {first} 末班: {last}")
        
        # 显示站点列表
        if show_stops:
            output.append(f"")
            output.append(f"📍 站点列表 ({len(stations)}站):")
            for s in sorted(stations, key=lambda x: x["stationNo"]):
                output.append(f"  {s['stationNo']}. {s['name']}")
            continue
        
        # 查询到达某站的来车
        if station_name:
            # 找到目标站
            target_no = None
            for s in stations:
                if station_name in s["name"]:
                    target_no = s["stationNo"]
                    target_name = s["name"]
                    break
            
            if target_no is None:
                output.append(f"❌ 未找到站点: {station_name}")
                continue
            
            output.append(f"")
            output.append(f"📍 你在: {target_name}站（第{target_no}站）")
            output.append(f"")
            output.append(f"🚌 来车信息:")
            
            # 筛选还没到站的车辆
            coming = []
            for bus in buses:
                no = bus["stationNo"]
                if no < target_no:
                    remain = target_no - no
                    coming.append({
                        "plate": bus["name"],
                        "station": station_map.get(no, f"第{no}站"),
                        "remain": remain,
                        "velocity": bus["velocity"]
                    })
            
            coming.sort(key=lambda x: x["remain"])
            
            if coming:
                for b in coming[:3]:
                    vel = int(b["velocity"])
                    status = f"行驶中 {vel}km/h" if vel > 0 else "停站中"
                    eta = b["remain"] * 2.5  # 预估每站2.5分钟
                    output.append(f"  {b['plate']} | {b['station']} | 还有 {b['remain']} 站 | {status} | 约 {int(eta)} 分钟")
            else:
                output.append(f"  暂无来车")
            
            continue
        
        # 显示运行中车辆
        output.append(f"")
        output.append(f"🚌 运行中车辆 ({len(buses)}辆):")
        
        for bus in sorted(buses, key=lambda x: x["stationNo"]):
            no = bus["stationNo"]
            station = station_map.get(no, f"第{no}站")
            vel = int(bus["velocity"])
            dist = bus["distance"]
            ratio = bus["ratio"]
            plate = bus["name"]
            
            status = "行驶中" if vel > 0 else "停站中"
            output.append(f"  {plate} | {station} | {status} {vel}km/h | 距下站 {dist}m | 满载 {ratio}%")
    
    return "\n".join(output)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="济南公交查询")
    parser.add_argument("line", help="线路名称，如 K93、163")
    parser.add_argument("--station", "-s", help="查询到达某站的来车时间")
    parser.add_argument("--stops", action="store_true", help="显示线路站点")
    
    args = parser.parse_args()
    
    try:
        result = query_bus(args.line, args.station, args.stops)
        print(result)
    except Exception as e:
        print(f"❌ 错误: {e}")
        sys.exit(1)
