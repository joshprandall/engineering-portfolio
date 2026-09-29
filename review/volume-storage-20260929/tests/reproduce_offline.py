from offline_fixture import *
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=launch_browser(p)
 page=b.new_page();fixture(page,storage='write-denied')
 result={'sourceCommit':'11f9f5e33bd8452b1b0538ffe285b8e9b354d865','fixture':'offline native Chromium DOM, embedded WAV substituted for original media URLs, simulated failed storage writes','before':snapshot(page)}
 set_slider(page,60);result['afterRequest60Percent']=snapshot(page)
 set_slider(page,0);result['afterRequestMute']=snapshot(page)
 print(json.dumps(result,indent=2));(ROOT/'evidence/before-storage-failure.json').write_text(json.dumps(result,indent=2));b.close()
