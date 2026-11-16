"""Provider-specific JSON transport. No credentials or upstream bodies are logged."""
import json
import urllib.request
from urllib.parse import urlparse

def complete_json(provider, key, model, instructions, context, schema, base_url="https://api.deepseek.com"):
    if provider == "deepseek":
        parsed = urlparse(base_url)
        if parsed.scheme != "https" or not parsed.hostname or parsed.username or parsed.password or parsed.query or parsed.fragment:
            raise ValueError("DeepSeek requires an HTTPS base URL")
        endpoint = base_url.rstrip("/") + "/chat/completions"
        payload = {
            "model": model, "messages": [
                {"role": "system", "content": instructions + "\nReturn ONLY a JSON object matching this JSON schema:\n" + json.dumps(schema)},
                {"role": "user", "content": json.dumps(context, ensure_ascii=False)},
            ],
            "response_format": {"type": "json_object"},
            "thinking": {"type": "disabled"},
            "max_tokens": 1000, "stream": False,
        }
    elif provider == "openai":
        endpoint = "https://api.openai.com/v1/responses"
        payload = {"model": model, "store": False, "instructions": instructions,
                   "input": json.dumps(context, ensure_ascii=False), "max_output_tokens": 1000,
                   "text": {"format": {"type": "json_schema", "name": "mia_reply", "strict": True, "schema": schema}}}
    else:
        raise ValueError("Unknown AI provider")
    request = urllib.request.Request(endpoint, data=json.dumps(payload).encode("utf-8"),
        headers={"Authorization": "Bearer " + key, "Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(request, timeout=16) as response:
        raw = response.read(1_000_001)
    if len(raw) > 1_000_000:
        raise ValueError("Oversized AI response")
    data = json.loads(raw)
    if provider == "deepseek":
        choice = data["choices"][0]
        if choice.get("finish_reason") != "stop":
            raise ValueError("Incomplete AI response")
        output = choice["message"]["content"]
    else:
        output = "".join(block.get("text", "") for item in data.get("output", [])
                         for block in item.get("content", []) if block.get("type") == "output_text")
    if not isinstance(output, str) or not output.strip():
        raise ValueError("Empty AI response")
    return output
