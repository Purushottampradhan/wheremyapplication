# If LinkedIn shows `chrome-extension://invalid`

LinkedIn sometimes probes or blocks extension URLs. WhereMyApplication **v1.5.0**:

- Save uses **on-demand** `scripting.executeScript` (not a permanent inject on every page)
- Easy Apply uses a **small content script only on LinkedIn jobs URLs**

## Fix steps

1. Remove the extension from `chrome://extensions`
2. Close **all** LinkedIn tabs
3. Load unpacked again from `WhereMyApplication/extension`
4. Open the side panel, sign in, Save from a job detail page

If errors persist with **all** extensions disabled, it is LinkedIn’s own detection — use Safari/another browser for LinkedIn browsing, or capture from the web app **Add** form.
