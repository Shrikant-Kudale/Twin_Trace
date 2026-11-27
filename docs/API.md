# API (all POST, JSON)
- `/api/resolve` `{type:'text'|'link'|'image', value}` -> `{name, image?, price?, ids?, via}`
- `/api/search` `{q}` -> `{results:[{title,url,domain,price,cur,image,ids,source}], sources:[{name,ok,count,error}]}`
- `/api/verify` `{a,b}` -> `{verdict:'YES'|'NO', reason, provider}`
- `/api/health` `{ping?}` -> `{active, search, providers?:[{name,ok,ms,model|error}]}`
- `GET /api/img?u=<url>` image proxy (png, jpeg, webp, gif, avif; 4 MB max; private hosts blocked)

