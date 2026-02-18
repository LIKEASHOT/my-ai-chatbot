import requests
import json
import os

# 配置 - 新的提供商
API_URL = "https://globalai.vip/v1/chat/completions"
MODEL_NAME = "gpt-3.5-turbo"

# 请将此处替换为您真实的 API Key
# 也可以设置环境变量 OPENAI_API_KEY，脚本会自动读取
API_KEY = os.getenv("OPENAI_API_KEY") or "sk-你的密钥填在这里"

def test_model():
    print(f"正在测试模型: {MODEL_NAME}")
    print(f"API 地址: {API_URL}")
    print(f"API Key (前10位): {API_KEY[:10]}...")
    
    if API_KEY.startswith("sk-你的密钥"):
        print("错误: 请先在脚本中填入正确的 API Key！")
        return

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_KEY}"
    }

    data = {
        "model": MODEL_NAME,
        "messages": [
            {"role": "user", "content": "你好，这是一个测试。请回复'测试成功'。"}
        ],
        "stream": False
    }

    try:
        # Force ignore any proxies to avoid local network issues
        response = requests.post(API_URL, headers=headers, json=data, timeout=30, proxies={"http": None, "https": None})
        
        # 打印状态码
        print(f"HTTP状态码: {response.status_code}")
        
        # 尝试解析 JSON
        try:
            result = response.json()
            # 漂亮打印 JSON
            print("\n--- 响应内容 ---")
            print(json.dumps(result, indent=2, ensure_ascii=False))
            
            if response.status_code == 200 and 'choices' in result:
                print("\n✅ 测试通过！模型可用。")
                print(f"回复内容: {result['choices'][0]['message']['content']}")
            else:
                print("\n❌ 测试失败。请检查错误信息。")
                
        except json.JSONDecodeError:
            print("响应不是有效的 JSON:")
            print(response.text)
            
    except Exception as e:
        print(f"请求发生异常: {e}")

if __name__ == "__main__":
    test_model()
