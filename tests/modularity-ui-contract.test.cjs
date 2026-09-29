const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(process.env.PORTFOLIO_RUNTIME_ROOT||path.join(__dirname,'..'));
const read=name=>fs.readFileSync(path.join(root,name),'utf8');

test('ambience CSS does not own shared shell or card surfaces',()=>{
  const css=read('site-scenes.css');
  const forbidden=[
    /\.site-global-header\b/,
    /\.site-header\b/,
    /\.project-card\b/,
    /\.home-project\b/,
    /\.education-cards\b/,
    /header\s+\.scene-sound-control/,
    /--control-glass\b/
  ];
  const found=forbidden.filter(re=>re.test(css)).map(re=>re.source);
  assert.deepEqual(found,[],'Ambience CSS must style only background/media surfaces. Shared shell, cards, and controls belong to the UI shell.');
});

test('shared shell owns transparent scroll track, opaque menu, and common glass',()=>{
  const css=read('site-responsive.css');
  assert.match(css,/html::\-webkit\-scrollbar\-track\{background:transparent\}/,'Page scrollbar track must be transparent');
  assert.match(css,/background:var\(--nav-menu-solid\)!important/,'Hamburger navigation must use the explicit opaque surface');
  assert.match(css,/--glass:rgba\(7,13,17,\.18\)/,'Night shared glass must use canonical opacity');
  assert.match(css,/--glass:rgba\(247,249,245,\.18\)/,'Day shared glass must use the same canonical opacity');
});

test('game topic tiles do not route to generic learning search',()=>{
  const html=read('game-development.html');
  assert.doesNotMatch(html,/learn-browse\.html\?q=/,'Game Development topic tiles must not dump users into generic Learning search');
  for(const topic of ['future-games','engine-architecture','game-ai','graphics-rendering','physics','animation','procedural-generation','technical-art','audio','multiplayer']){
    assert(html.includes('game-tools.html?topic='+topic),topic+' must have a dedicated Game Development destination');
  }
});
