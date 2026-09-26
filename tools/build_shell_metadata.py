"""Derive compact navigation/search payloads from the reviewed route owner."""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def main():
    routes=json.loads((ROOT/'manifests/site-routes.json').read_text(encoding='utf-8'))
    nav=routes['navigation'];parents={}
    for r in routes['routes']:
        p=r['path']
        if p.startswith('project-'):parents[p]='projects.html'
        if p in ('project-battle-chess.html','play-evil-wizard.html'):parents[p]='game-development.html'
    (ROOT/'assets/site-navigation.json').write_text(json.dumps({'items':nav,'parents':parents},indent=2)+'\n')
if __name__=='__main__':main()
