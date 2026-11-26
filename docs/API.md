# API (all POST, JSON)
- `/api/resolve` `{type:'text'|'link'|'image', value}` -> `{name, image?, price?, ids?, via}`
- `/api/search` `{q}` -> `{results:[{title,url,domain,price,cur,image,ids,source}], sources:[{name,ok,count,error}]}`
- `/api/verify` `{a,b}` -> `{verdict:'YES'|'NO', reason, provider}`
- `/api/health` `{ping?}` -> `{active:{xai,pollinations,gemini,hf}, ping?}`

