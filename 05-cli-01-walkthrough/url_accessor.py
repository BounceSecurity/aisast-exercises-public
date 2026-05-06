import requests

def access_url(url):
    # Note: This function assumes the URL is properly constructed
    # The safety of this function depends on how it's called
    try:
        response = requests.get(url, timeout=5)
        return {
            "status": response.status_code,
            "content": response.text[:100],  # Return first 100 characters for brevity
            "headers": dict(response.headers)
        }
    except requests.RequestException as e:
        return {"error": str(e)}