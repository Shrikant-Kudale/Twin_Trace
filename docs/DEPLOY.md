# Deploy on Vercel
1. Push to GitHub. 2. Import the repo, framework "Other", no build command. 3. Deploy.
4. Project Settings > Environment Variables: add the keys you have (see `.env.example`), then redeploy.
5. Open the app > Guide > "Test all AI routes". It shows which routes work and the exact error for any that fail.

Recommended set: POLLINATIONS_API_KEY, GEMINI_API_KEY, XAI_API_KEY. For more reliable web search add BRAVE_API_KEY.
