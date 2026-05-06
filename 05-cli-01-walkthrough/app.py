from flask import Flask, request, jsonify
from url_accessor import access_url, access_user_info

app = Flask(__name__)

@app.route("/full_ssrf")
def full_ssrf():
    target = request.args.get("target")
    if not target:
        return jsonify({"error": "Target is required"}), 400

    # UNSAFE: Direct user input is used to construct the URL
    # This is vulnerable to SSRF attacks
    url = f"https://{target}.example.com/data/"
    result = access_url(url)
    return jsonify(result)

@app.route("/safe_ssrf")
def safe_ssrf():
    target = request.args.get("target")
    if not target:
        return jsonify({"error": "Target is required"}), 400

    # SAFE: User input is validated and mapped to predefined subdomains
    # This prevents SSRF attacks by limiting possible URLs
    subdomain = "europe" if target.upper() == "EU" else "world"
    url = f"https://{subdomain}.example.com/data/"
    result = access_url(url)
    return jsonify(result)

if __name__ == "__main__":
    app.run(debug=True)