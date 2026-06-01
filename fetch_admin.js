const http = require('http');
const https = require('https');

async function fetchDashboard() {
  const loginUrl = 'https://wealthtrading.xyz/admin';
  
  // POST to login
  const params = new URLSearchParams();
  params.append('username', 'Testing1');
  params.append('password', '654321');
  params.append('submit', 'Sign in');
  
  const postRes = await fetch(loginUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Referer': loginUrl
    },
    redirect: 'manual', // Don't auto follow so we can catch new cookies
    body: params.toString()
  });
  
  console.log("Login POST status:", postRes.status);
  const cookies = postRes.headers.get('set-cookie');
  console.log("Cookies:", cookies);
  const redirectUrl = postRes.headers.get('location');
  console.log("Redirect URL:", redirectUrl);
  
  // 3. GET dashboard
  let targetUrl = loginUrl;
  if (redirectUrl) {
    if (redirectUrl.startsWith('http')) targetUrl = redirectUrl;
    else targetUrl = 'https://wealthtrading.xyz' + redirectUrl;
  }
  
  const dashRes = await fetch(targetUrl, {
    headers: {
      'Cookie': cookies,
      'User-Agent': 'Mozilla/5.0'
    }
  });
  
  const dashHtml = await dashRes.text();
  const fs = require('fs');
  fs.writeFileSync('admin_reference.html', dashHtml);
  console.log("Saved dashboard HTML to admin_reference.html");
}

fetchDashboard().catch(console.error);
