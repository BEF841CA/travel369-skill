#!/usr/bin/env python3
"""
济南公交 (出行369) 登录模块
扫码登录获取 token
"""

import requests
import time
import json
import os

BASE_URL = "https://api.369cx.cn/v2"
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
TOKEN_FILE = os.path.expanduser("~/.openclaw/jinan-bus-token.json")


def get_qrcode():
    """获取二维码"""
    headers = {"User-Agent": USER_AGENT}
    resp = requests.get(f"{BASE_URL}/Auth/LoginByScan/1", headers=headers)
    data = resp.json()
    qr_id = data.get("status", {}).get("msg")
    if qr_id:
        qr_url = f"https://jngj.369cx.cn/scanlogin.html?{qr_id}"
        return qr_id, qr_url
    return None, None


def check_scan_status(qr_id):
    """检查扫码状态"""
    headers = {"User-Agent": USER_AGENT}
    resp = requests.get(f"{BASE_URL}/Auth/LoginByScan/{qr_id}", headers=headers)
    data = resp.json()
    
    code = data.get("status", {}).get("code")
    
    if code == 0 and data.get("result", {}).get("token"):
        return "success", data["result"]
    elif code == 401:
        return "waiting", None
    else:
        return "error", data


def login(timeout=120):
    """
    执行扫码登录
    
    Returns:
        (success, token_info) 或 (False, error_msg)
    """
    qr_id, qr_url = get_qrcode()
    if not qr_id:
        return False, "获取二维码失败"
    
    print(f"请扫码登录: {qr_url}")
    print(f"等待扫码... (超时 {timeout} 秒)")
    
    start_time = time.time()
    while time.time() - start_time < timeout:
        status, result = check_scan_status(qr_id)
        
        if status == "success":
            save_token(result)
            return True, result
        elif status == "error":
            return False, result
        
        time.sleep(2)
    
    return False, "扫码超时"


def save_token(token_info):
    """保存 token"""
    token_info["saved_at"] = time.time()
    os.makedirs(os.path.dirname(TOKEN_FILE), exist_ok=True)
    with open(TOKEN_FILE, "w") as f:
        json.dump(token_info, f)


def load_token():
    """加载已保存的 token"""
    if os.path.exists(TOKEN_FILE):
        with open(TOKEN_FILE, "r") as f:
            return json.load(f)
    return None


def get_valid_token():
    """
    获取有效的 token
    如果已保存且未过期则直接返回，否则需要重新登录
    """
    token_info = load_token()
    if token_info:
        saved_at = token_info.get("saved_at", 0)
        # token 有效期约 30 天
        if time.time() - saved_at < 30 * 24 * 3600:
            return token_info.get("token")
    
    return None


if __name__ == "__main__":
    success, result = login()
    if success:
        print(f"\n✅ 登录成功!")
        print(f"用户: {result.get('nickName')}")
    else:
        print(f"\n❌ 登录失败: {result}")
