import urllib.request
import urllib.parse
import re

url = 'https://wealthtrading.xyz/admin'
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
}

req = urllib.request.Request(url, headers=headers)
try:
    with urllib.request.urlopen(req) as response:
        html = response.read().decode('utf-8')
        cookies = response.getheader('Set-Cookie')
        
        token_match = re.search(r'name="_token"[^>]*value="([^"]+)"', html)
        if not token_match:
            print("No CSRF token found.")
            with open('py_login.html', 'w', encoding='utf-8') as f:
                f.write(html)
            exit(1)
            
        token = token_match.group(1)
        print("Token:", token)
        
        data = urllib.parse.urlencode({
            '_token': token,
            'username': 'Testing1',
            'password': '654321'
        }).encode('utf-8')
        
        req_post = urllib.request.Request(url, data=data, headers={
            'User-Agent': headers['User-Agent'],
            'Cookie': cookies,
            'Content-Type': 'application/x-www-form-urlencoded',
            'Referer': url
        })
        
        with urllib.request.urlopen(req_post) as post_response:
            print("Post URL:", post_response.geturl())
            post_html = post_response.read().decode('utf-8')
            with open('admin_dashboard.html', 'w', encoding='utf-8') as f:
                f.write(post_html)
            print("Saved to admin_dashboard.html")
except Exception as e:
    print("Error:", e)
