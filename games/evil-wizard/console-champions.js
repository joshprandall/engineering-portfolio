(() => {
  'use strict';

  const champions = [
    ['warrior','Warrior'],['mage','Mage'],['rogue','Rogue'],['paladin','Paladin'],
    ['archer','Archer'],['barbarian','Barbarian'],['fighter','Fighter'],['monk','Monk'],
    ['ranger','Ranger'],['cleric','Cleric'],['bard','Bard'],['druid','Druid'],
    ['sorcerer','Sorcerer'],['warlock','Warlock'],['wizard','Wizard']
  ];

  const actions = [
    ['jump','Jump'],['dash','Dash'],['attack','Attack'],['heavy_attack','Heavy Attack'],
    ['ability_one','Ability 1'],['ability_two','Ability 2'],['interact','Interact'],
    ['ultimate','Ultimate'],['pause','Pause']
  ];

  const keyOptions = [
    [32,'Space'],[65,'A'],[66,'B'],[67,'C'],[68,'D'],[69,'E'],[70,'F'],[71,'G'],
    [72,'H'],[73,'I'],[74,'J'],[75,'K'],[76,'L'],[77,'M'],[78,'N'],[79,'O'],
    [80,'P'],[81,'Q'],[82,'R'],[83,'S'],[84,'T'],[85,'U'],[86,'V'],[87,'W'],
    [88,'X'],[89,'Y'],[90,'Z'],[4194325,'Shift'],[4194305,'Escape'],
    [4194311,'Left Arrow'],[4194312,'Up Arrow'],[4194313,'Right Arrow'],[4194314,'Down Arrow']
  ];

  const gamepadOptions = [
    ['button:0','South / A / Cross'],['button:1','East / B / Circle'],
    ['button:2','West / X / Square'],['button:3','North / Y / Triangle'],
    ['button:9','Left Shoulder / LB / L1'],['button:10','Right Shoulder / RB / R1'],
    ['axis:4:1','Left Trigger / LT / L2'],['axis:5:1','Right Trigger / RT / R2'],
    ['button:4','View / Back / Create'],['button:6','Menu / Start / Options'],
    ['button:7','Left Stick Click'],['button:8','Right Stick Click']
  ];

  const defaults = {
    champion:'warrior',
    mode:'auto',
    fullscreen:true,
    difficulty:'adventurer',
    cameraShake:true,
    masterVolume:85,
    brightness:100,
    touch:{
      style:'xbox',
      size:'compact',
      hand:'right',
      opacity:68,
      map:{
        south:'jump',east:'dash',west:'attack',north:'heavy_attack',
        l1:'ability_one',r1:'ability_two',l2:'interact',r2:'ultimate'
      }
    },
    keyboard:{
      jump:87,dash:4194325,attack:32,heavy_attack:75,interact:70,
      ability_one:76,ability_two:73,ultimate:85,pause:4194305
    },
    gamepad:{
      jump:'button:0',dash:'button:1',attack:'button:2',heavy_attack:'button:3',
      ability_one:'button:9',ability_two:'button:10',interact:'axis:4:1',
      ultimate:'axis:5:1',pause:'button:6'
    }
  };

  const guides = {
    touch:'Phone / Tablet: use the larger floating left joystick for movement; pull it downward to crouch. There is no virtual D-pad. The larger face-button diamond mirrors a gamepad, shoulders and triggers sit along the top edges, and the game remains visible underneath. Every virtual action button can be reassigned in Controls.',
    keyboard:'Keyboard / mouse: A / D or ← / → move · S / Q crouch. The action keys below are remappable. Left mouse always performs Attack and right mouse performs Heavy Attack.',
    xbox:'Xbox / standard gamepad: left stick or D-pad moves, down crouches, right stick aims. Every action button can be reassigned in Controls.',
    playstation:'PlayStation controller: left stick or D-pad moves, down crouches, right stick aims. Cross/Circle/Square/Triangle, shoulders and triggers can be reassigned in Controls.'
  };

  window.EvilWizardSetup = {champions,actions,keyOptions,gamepadOptions,defaults,guides};
})();