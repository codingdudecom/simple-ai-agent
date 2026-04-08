# TODO Checklist – How to Execute the Request (Publish & Promote the New MockoFun YouTube Tutorial)

---

## 1️⃣ Gather Video Metadata
- [ ] Open the YouTube URL (https://youtu.be/vl92HY3V7mc) in a Chrome tab.
- [ ] Capture the video title, description, and tags using chrome-devtools-evaluate_script (or the “Copy video title” shortcut).
- [ ] Store the extracted metadata in a temporary file (@video-meta.txt).

## 2️⃣ Perform Keyword Research
- [ ] Activate the youtube-keywords-research skill to pull auto‑complete suggestions for the video’s topic.
- [ ] Save the keyword list to @youtube‑keywords.txt.
- [ ] Identify 3–5 high‑relevance LSI keywords to embed in the video’s metadata.

## 3️⃣ Optimize Video SEO
- [ ] Draft an optimized title and description that incorporate the top keywords.
- [ ] Add relevant tags (up to 15) based on the keyword research.
- [ ] Use the content-creator skill to ensure the copy follows the brand voice and includes a clear call‑to‑action.

## 4️⃣ Create Promotional Visuals
- [ ] Design a custom thumbnail (YouTube thumbnail size 1280 × 720) using the canvas-design skill.
- [ ] Generate a short promotional GIF for social platforms (e.g., Slack, Twitter) using the slack-gif-creator skill.
- [ ] If needed, create an infographic summarizing the tutorial steps with the infographic-creator skill.

## 5️⃣ Draft Social‑Media & Community Posts
- [ ] Write platform‑specific posts (Twitter, LinkedIn, Facebook, Reddit) using the content-creator skill.
- [ ] Apply brand‑consistent styling via the brand-guidelines skill (colors, fonts).
- [ ] Schedule posts using your internal social‑media calendar (e.g., via a simple CSV or a scheduling tool).

## 6️⃣ Publish Supporting Content (Optional)
- [ ] If a blog post or newsletter is desired, generate one using the doc-coauthoring or content-creator skill.
- [ ] Insert the optimized title, description, and links to the video and thumbnail assets.

## 7️⃣ Monitor & Analyze Performance
- [ ] After 24‑48 h, pull initial analytics (views, watch‑time, click‑through) from YouTube Studio.
- [ ] Use the seo-article-optimizer skill to score the video description’s SEO strength (treat it as a “landing page”).
- [ ] Adjust keywords or posting schedule based on the early data.

## 8️⃣ Archive & Document the Process
- [ ] Store all generated files (metadata, keywords, assets, copy) in a dedicated folder (@mockofun‑tutorial‑assets/).
- [ ] Write a brief “post‑mortem” summarizing what worked and next steps (use docx or markdown format).

---

**Notes for Execution**
- Activate each skill by calling activate_skill with the appropriate absolute path (e.g., activate_skill("/Users/john/.gemini/skills/youtube-keywords-research")).
- When using Chrome DevTools commands, first list_pages, then select_page to target the YouTube tab, and finally issue the desired command (e.g., chrome-devtools-evaluate_script).
- Keep all file writes relative to the current working directory and include a @ prefix to reference them in subsequent tool calls.