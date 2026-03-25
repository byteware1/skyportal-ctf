const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

// ⚠️ INTENTIONALLY VULNERABLE - Reflected XSS
// User input is directly reflected into HTML without sanitization
app.get('/search', (req, res) => {
  const query = req.query.q || '';

  // VULNERABLE: raw user input reflected in response
  res.send(`<!DOCTYPE html>
<html><head>
  <meta charset="UTF-8">
  <title>HackBlog - Search</title>
  <link rel="stylesheet" href="/style.css">
</head><body>
  <header>
    <div class="logo">HACK<span>BLOG</span></div>
    <nav>
      <a href="/">Home</a>
      <a href="/search">Search</a>
      <a href="/about">About</a>
    </nav>
  </header>
  <main>
    <div class="search-box">
      <form action="/search" method="GET">
        <input type="text" name="q" value="${query}" placeholder="Search posts...">
        <button type="submit">Search</button>
      </form>
    </div>
    <div class="results">
      <p class="search-info">You searched for: <strong>${query}</strong></p>
      <p class="no-results">No results found for your query.</p>
    </div>
  </main>
  <div style="display:none" id="flag-container" data-flag="FLAG{reflected_xss_alert_executed}"></div>
</body></html>`);
});

// Safe static pages
app.get('/about', (req, res) => {
  res.send(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>About</title><link rel="stylesheet" href="/style.css"></head><body>
  <header><div class="logo">HACK<span>BLOG</span></div><nav><a href="/">Home</a><a href="/search">Search</a></nav></header>
  <main><h1>About HackBlog</h1><p>A security research blog. The search feature has a vulnerability - can you find it?</p></main></body></html>`);
});

app.listen(PORT, () => {
  console.log(`\n💀 XSS Lab running on port ${PORT}`);
  console.log(`⚠️  This application is INTENTIONALLY VULNERABLE`);
  console.log(`🎯 Objective: Execute JavaScript via reflected XSS`);
});
