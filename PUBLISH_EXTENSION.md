# Publish the Chrome extension (anyone can install)

The extension is not hosted on Render. Users install it from the **Chrome Web Store** (or Load unpacked while developing). After install they sign in to *your* WhereMyApplication API.

## Before you publish

1. Deploy API + web on Render ([DEPLOY.md](./DEPLOY.md)).
2. Bump `version` in `extension/manifest.json` for each store upload.
3. Set default API/web URLs in the side panel UI to your production hosts (users can still override).
4. Prepare assets:
   - Icon 128×128 (you already have `icons/icon128.png`)
   - Store icon 128×128
   - Screenshots (1280×800 or 640×400): side panel open on LinkedIn, dashboard, kanban
   - Short description + detailed description

## Developer mode (you / testers)

1. `chrome://extensions` → **Developer mode**
2. **Load unpacked** → select `WhereMyApplication/extension`
3. Pin the extension → click the icon → **side panel** opens and stays open until closed
4. Sign in; enable Easy Apply auto-capture if desired

## Chrome Web Store (public)

1. Create a [Chrome Web Store developer account](https://chrome.google.com/webstore/devconsole) (one-time registration fee)
2. Zip the extension folder contents (not the parent repo):

```bash
cd WhereMyApplication/extension
zip -r ../wheremyapplication-extension.zip . \
  -x "*.DS_Store" -x "FIX_LINKEDIN.md"
```

3. **New item** → upload the zip
4. Fill listing:
   - Name: WhereMyApplication Capture
   - Category: Productivity
   - Privacy: explain that job page text + login token are sent only to the user’s configured API URL
5. Permissions justification:
   - `activeTab` / `scripting`: scrape the open job page on Save
   - `storage`: token + API URL
   - `sidePanel`: keep capture UI open while browsing
   - Host access: LinkedIn / Indeed / Naukri + user API (optional hosts for Render)
6. Submit for review (can take a few days)

## After users install

1. They open the side panel and set **API base** to your Render API (or you ship it as the default in a future build)
2. Register on your web app, then sign in inside the extension
3. Browse jobs → **Save this job**, or complete LinkedIn Easy Apply for auto-capture

## Unlisted / private sharing

- Chrome Web Store supports **Unlisted** visibility (link-only)
- Or share the zip + “Load unpacked” instructions for a small group (Developer mode required)

## LinkedIn note

If LinkedIn shows `chrome-extension://invalid`, it is often LinkedIn probing extensions. This build only injects a small Easy Apply observer on LinkedIn jobs URLs; Save still uses on-demand `scripting.executeScript`. See `FIX_LINKEDIN.md` if issues persist.
