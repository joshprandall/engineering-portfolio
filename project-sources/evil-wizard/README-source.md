# Defeat the Evil Wizard — Complete Rough Draft v2.0.2

This build extends the stable Fallen Village campaign with persistence, progression, story interaction, enemy-behavior improvements, and a dedicated movement laboratory. Warrior and Mage remain fully playable, but the road to the Black Tower is now longer, more structured, and built around exploration, a miniboss, optional collectibles, checkpoints, and environmental landmarks.


## 0.4.3 — Black Gate stability

This patch hardens the Evil Wizard encounter before campaign development continues.

- Corrected the boss arena coordinates to the actual Black Gate location.
- Shadow Step now always reappears inside the sealed boss arena.
- The 10% maximum-health Void Step cost remains intentional.
- Summoned enemies now use the correct Black Gate arena bounds.
- Boss position is clamped back inside the encounter if physics or knockback ever pushes it outside.
- A fall-recovery failsafe restores the boss to the arena instead of allowing the encounter to break.
- The Black Gate walls now extend beyond the playable camera height, preventing wall-jump escape.
- Boss retries preserve the corrected arena bounds and restore a safe position.

## New in 0.4

### Fallen Village region
- Expanded world width and traversal route.
- Ruined village skyline, chapel, gatehouse, houses, carts, lamps, and a well.
- Two checkpoint shrines.
- Additional platform routes and rune hazards.
- Region and landmark announcements as the player advances.

### Arcane Shards
Five optional Arcane Shards are placed along the road, including elevated routes.

Each shard:
- restores health;
- adds Rage for Warrior or Mana for Mage;
- updates the HUD counter.

Recovering all five fully restores the champion's class resource and grants a larger heal before the Black Gate.

### Grave Knight miniboss
A new miniboss now guards the broken village gate.

The Grave Knight includes:
- shield-based damage mitigation;
- breakable guard;
- telegraphed sword attacks;
- a charging attack;
- a faster enraged phase below half health;
- dedicated health presentation;
- arena gates and retry behavior.

The Black Road does not open until the Grave Knight is defeated.

### Campaign flow
The current playable sequence is now:

1. Choose Warrior or Mage.
2. Enter the Fallen Village.
3. Explore alternate routes and recover Arcane Shards.
4. Awaken the village checkpoint.
5. Defeat the Grave Knight.
6. Reach the Black Road checkpoint.
7. Enter the Black Gate.
8. Defeat the Evil Wizard's three-phase encounter.

## Champions

### Warrior
- Three-hit sword combo
- Heavy cleave
- Dash
- Shield Bash
- Whirlwind
- Last Stand

### Mage
- Arcane Bolt
- Charged Arcane Bolt
- Blink
- Frost Nova
- Flame Wave
- Meteor
- Regenerating mana

## Movement foundation
- Separate ground and air acceleration.
- Coyote time.
- Jump buffering.
- Variable jump height.
- Faster falling than rising.
- Wall sliding and wall jumping.
- Dash-jump momentum interaction.
- Directional movement during attacks.

Movement and animation are still scheduled for deeper refinement after the campaign systems are established.

## Run
Open `project.godot` with Godot 4.7.2 and press Play Project.

## Controls

The default keyboard layout follows the familiar action-game pattern while keeping actions readable on a small screen:

- W / A / S / D: directional movement
- E (or W): jump / wall jump
- Q: crouch; hold while grounded
- Space or left mouse: light attack / fire
- K or right mouse: heavy attack
- Shift or X: dash / slide
- L / I: class abilities
- U: ultimate when the class resource is full
- F: interact with characters, levers, runes, mirrors, and travel nodes
- ` (backquote): open the control console
- Esc: pause

On phones and tablets, rotate to landscape. The game shows a left virtual stick, large square action buttons, independent multi-touch holds, and a console button that opens the complete control legend. The touch layer maps to the same input actions as the keyboard and gamepad, so a player can change input method without changing gameplay rules.

## Development status
0.4 is the first authored-region milestone. Visuals are still largely procedural by design while the game structure, combat, traversal, progression, encounter flow, and class architecture are being established. Final character art, animation, environment art, effects, and audio production come after these systems stabilize.

## 0.4.4 — Grave Knight arena timing

The first boss now seals the arena only after the player is safely inside it. The trigger moved from X=4560 to X=4860 while the left wall remains at X=4635, so the wall rises behind the player rather than in front of them.


## 0.5 — Progression & Persistence

### Save / Continue
- Checkpoint progress is written to `user://last_road_save.json`.
- The title screen now enables **Continue** when a valid save exists.
- Saves remember champion, checkpoint stage, permanent blessings, collected shard identities, and Grave Knight completion.
- Starting a new champion clears the previous journey.

### Shrine blessings
Each road shrine now grants one permanent, unique blessing:
- **Vitality** — +24 maximum health.
- **Might** — +12% permanent damage.
- **Swiftness** — +8% movement/acceleration and improved jump/dash speed.

### Story interaction
- Added Mara, the Bellkeeper, near the old chapel.
- Press **E** near Mara to advance a short multi-line conversation.
- The NPC/dialogue architecture is intentionally reusable for future characters.

### Enemy behavior
- Wisps now maintain range and fire real projectiles instead of behaving like melee enemies.
- Crawlers add a short lunge to their attack.
- Sentinels remain heavy close-range pressure enemies.

### Movement Lab
Choose **Movement Lab** from the title screen.
- Press 1 / 2 to switch Warrior and Mage.
- Press R to reset.
- The overlay reports horizontal speed, vertical speed, grounded state, and wall contact.
- Press Esc to return to the campaign.


## 0.6 — Motion & Shadow

### Third playable champion: Rogue
The Rogue is the first champion built specifically to stress-test high-speed traversal.

- Four-hit dagger chain.
- Backstab Rush heavy attack.
- Smoke Step.
- Fan of Knives.
- One mid-air double jump.
- Faster acceleration, turning, and dash recovery.
- Shadow resource generated through aggressive combat.
- Shadow Dance ultimate with enhanced damage and repeated afterimages.

### Movement feel pass
- Added dash input buffering.
- Added light-attack input buffering.
- Reversing direction now receives stronger acceleration for more responsive turns.
- Rogue introduces a true air-jump state.
- Wall jumps replenish the Rogue air jump.
- Movement Lab now displays the current animation state and remaining air jumps.

### Animation pipeline
The procedural characters still use code-drawn visuals, but player animation is no longer implicit.

The Hero now exposes named states:
- idle
- run
- jump
- fall
- wall_slide
- dash
- attack

Those states are designed to map directly onto authored sprite/rig animations later without changing combat logic.

### Visual motion pass
- Dynamic ground shadows.
- Idle breathing.
- Class-specific attack arcs and spell circles.
- Dash afterimages.
- Continuous Shadow Dance afterimages.
- Rogue-specific silhouette, hood, twin blades, and aura.
- Wall-slide contact streaks.

This remains a systems/art-direction bridge. Final character art will replace these procedural bodies after movement and attack timing are locked.


## 0.7 — Whispering Woods

The campaign now continues beyond the Black Gate.

### Story turn
Defeating the Evil Wizard at the Black Gate reveals that the enemy was only a manifested shadow. The true Wizard remains ahead.

### New region
- Whispering Woods begins immediately beyond the Black Gate.
- Moonlit forest visual treatment.
- Layered procedural trees, fog, and fireflies.
- New platforms and exploration routes.
- Deepwood checkpoint and shrine.
- New forest props and glowing environmental details.

### New enemies
- **Briarling** — aggressive pouncing melee creature.
- **Gloom Moth** — airborne ranged enemy.
- **Root Guard** — heavy forest defender.

### New region boss
**The Briar Hart** guards the Heart Grove with:
- antler strikes,
- charge attacks,
- thorn volleys,
- a more aggressive second phase.

### Fourth champion: Paladin
- Consecrated three-hit combo.
- Smite heavy attack.
- Divine Guard with a perfect-guard window.
- Sacred Nova.
- Righteous Dash.
- Judgment ultimate.
- Faith resource.
- Temporary Sacred Armor.

### Visual pipeline
An animation manifest now defines production animation states for Warrior, Mage, Rogue, and Paladin so final authored character art can replace procedural bodies without changing combat timing.


## 0.7.1 — Champion Select Layout Fix

The four-champion title screen has been rebuilt as a 2×2 selection grid.

The previous four-column layout inherited a 400-pixel minimum width from the shared menu-button style. Four cards therefore required more horizontal space than the 1280-pixel game canvas and pushed Paladin off-screen.

0.7.1 keeps all four champions visible, preserves readable class kits, keeps every Play button inside the canvas, and leaves gameplay unchanged.


## 0.7.2 — Bellkeeper Visual Clarity

Mara's original procedural placeholder looked too similar to a second playable character and the circular aura behind her head did not communicate what she was.

Mara has been redesigned as an unmistakable story NPC:
- hooded Bellkeeper silhouette,
- visible bell staff,
- warm lantern glow,
- world-space MARA / BELLKEEPER nameplate,
- explicit interaction marker,
- no head halo,
- larger interaction radius,
- subtle idle motion.

No combat or campaign balance changed.


## 0.8 — Sunken Keep

The road now continues beyond the Whispering Woods into the flooded fortress beneath the mountain.

### Sunken Keep region
- New drowned-stone visual language.
- Cold windows, flooded masonry, chains, arches, statues, and blue flame.
- Moving platforms.
- Retracting spike traps.
- Arcane floor runes.
- Ceiling crushers.
- Fourth campaign checkpoint and shrine.

### New enemies
- **Drowned Guard** — armored melee pressure.
- **Rune Caster** — ranged keep sorcerer.
- **Crypt Leech** — fast low-health rush attacker.

### Regional boss
**The Drowned Castellan**
- anchor strikes,
- armored charge,
- tide volleys,
- phase-two flood burst,
- arena containment,
- second phase at 50% health.

Defeating the Castellan opens the route toward the **Blighted Mountains**.

### Fifth champion: Archer
- Quick Shot.
- Power Shot.
- Piercing Arrow.
- Arrow Rain.
- Vault-style fast dash.
- Perfect Volley ultimate.
- Focus resource generated by projectile hits.

### Shrine expansion
Two new permanent blessings enter the shrine pool:
- **Resilience** — 10% less incoming damage.
- **Devotion** — 20% more resource generation.

There are now five possible blessings, so later shrines continue to offer meaningful choices without soft-locking progression.


## v1.0 — Story & Labyrinth

This milestone changes the campaign from a sequence of combat regions into a more complete action-adventure.

### Cinematic storytelling
A reusable cinematic director now presents illustrated in-engine story panels between major regions.

Current sequences:
- Prologue — The Last Road
- Interlude I — A Shadow Dies
- Interlude II — The Woods Exhale
- Interlude III — The Drowned Crown
- Interlude IV — The Memory Gate

Cutscenes can be advanced with **E, Space, or Attack** and pause normal gameplay while active.

### The Memory Labyrinth
After defeating the Drowned Castellan, the road no longer proceeds directly into another combat zone.

The player enters a multi-level side-view labyrinth with:
- vertical route choices,
- dead ends,
- moving platforms,
- rune hazards,
- retracting spikes,
- backtracking,
- a locked Memory Gate,
- a three-symbol history puzzle.

The solution is taught through previous story events, the transition cutscene, and a mural in the labyrinth:

**Bell → Moon → Crown**

A wrong rune resets the puzzle.

Solving all three opens the Memory Gate and reveals the Blighted Mountains beyond.

### Character presentation pass
The procedural champions now have:
- directional body lean,
- stronger run cadence,
- arm motion,
- class-specific facial details,
- belts, straps, armor seams, and trim,
- landing squash/impact rings,
- running dust,
- more readable equipment silhouettes.

The project still keeps gameplay timing independent of final authored sprite art, allowing later animation replacement without rewriting combat.

### Environment presentation pass
The new labyrinth contains layered masonry, haze, light shafts, rune murals, changing elevation, and a mountain vista that visually previews the next region.

The control guide has also been reformatted into two rows so it remains readable at 1280×720.


## v1.0.1 — Sound of the Realm

The campaign now has a contextual original soundtrack.

Nine music cues cover:
- title screen,
- Fallen Village,
- Whispering Woods,
- Sunken Keep,
- Memory Labyrinth,
- regional bosses,
- Evil Wizard encounter,
- cinematics,
- Blighted Mountains approach.

Music switches automatically by region and combat state with fades between cues.

Fourteen additional sound effects add stronger feedback to Archer combat, Paladin guarding, Mara, cinematics, puzzles, traps, bosses, and the Memory Gate.

The Movement Lab now plays music and combat SFX as well.


## v1.1 — Blighted Mountains

The campaign now continues beyond the Memory Labyrinth.

### New region
The Blighted Mountains extend the playable world with:
- high-wind traversal,
- collapsing platforms,
- exposed mountain routes,
- ash and snow,
- blight fissures,
- a visible Black Tower in the distance.

### New puzzle
Three Storm Vanes seal the summit road.

The clue given by Mara is:
- first → rising sun → RIGHT,
- second → setting sun → LEFT,
- third → summit → UP.

The solved gate state is saved.

### Sixth champion: Barbarian
- three-hit axe chain,
- Heavy Cleave,
- Reckless Leap,
- Ground Slam,
- Berserk,
- Worldbreaker,
- Fury resource.

### New enemies
- Ash Hound
- Storm Shaman
- Stone Raider

### New boss
**The Ash Colossus** guards the summit with slams, charges, boulders, and a stronger second phase.

### Progression
A sixth checkpoint/shrine has been added, along with **Renewal**, a new permanent blessing that increases healing received by 25%.

### Audio
Seven new mountain/Barbarian effects were added for wind, cracking stone, boulders, slams, roars, and axe combat.


## v1.2 — Black Tower

The campaign now enters the Black Tower.

### Lower Spire
The new tower region adds:
- Arcane elevators,
- phase platforms that disappear on a readable rhythm,
- multi-level interior routes,
- magical conduits and windows,
- a dedicated Black Tower music cue.

### Mirror Vault
Three Arcane Mirrors seal the Upper Spire.

The story clue maps them to:
- Moon → UP
- Heart → RIGHT
- Road → LEFT

The solved state is saved.

### Seventh champion: Fighter
- technical sword combo,
- Breaker Thrust,
- Combat Roll,
- Parry,
- Riposte,
- Relentless Assault,
- Momentum resource.

A successful Parry completely negates the hit, grants Momentum, and triggers a counterstrike.

### New enemies
- Void Sentry
- Arcane Eye
- Shadow Knight

### New boss
**The Obsidian Warden** guards the Crown Seal with blink movement, orb volleys, void waves, temporary barriers, and three combat phases.

Defeating it opens the path to the **Crown Chamber**, where the true Evil Wizard waits.

### Seventh blessing
**Steadfast** reduces incoming knockback by 25%.

### Audio
Two additional music cues and seven new effects were added for the tower, mirrors, Fighter, phase platforms, and Warden.


## v1.3 — Crown Chamber

The first playable campaign arc now reaches its true finale.

### Crown Chamber
Beyond the Obsidian Warden is a cathedral-scale final chamber with a suspended crown, stained-glass history panels, a final shrine, multi-level arena geometry, and its own music.

### Eighth champion: Monk
- four-hit martial combo
- Palm Strike
- Wind Step
- Flurry
- Inner Peace
- Hundred Hands
- Chi resource

### Eighth blessing
**Ascension** — respawn with at least 35% class resource.

### True Evil Wizard
The final encounter has four distinct phases.

**Phase I — Duel**

**Phase II — Crown Seal**
Three destructible Crown Sigils appear. While any remain, the Wizard takes only 12% normal damage.

**Phase III — Roads Return**
The fight adds summons, denser projectile patterns, Crown Rain, void waves, and faster Void Step.

**Phase IV — Mortal Spell**
The Wizard burns 0.9% of maximum health per second while casting at maximum aggression.

Every Void Step also costs 3% maximum health.

### Ending
The Wizard's defeat now triggers a complete epilogue and victory screen. Collecting all five Arcane Shards adds an extra ending beat.

### Audio
Three new music cues and nine new sound effects support the Crown Chamber, the final encounter, the epilogue, and Monk.


## v1.3.1 — Storm Vane clarity & HUD readability patch

This patch responds directly to runtime playtesting in the Blighted Mountains.

### Storm Vane improvements
- interaction radius increased from 115px to 175px,
- each vane now has a much larger directional arrow,
- a pulsing ground halo makes the object read as interactive,
- approaching a vane produces a large world-space **E** interaction beacon,
- correctly aligned vanes display a persistent confirmation mark,
- correct and incorrect rotations have different audio/announcement feedback.

### Puzzle HUD
A contextual tracker now appears while an environmental puzzle is active.

Examples:
- `STORM VANES  1 / 3`
- `ARCANE MIRRORS  2 / 3`
- `CROWN SIGILS  1 / 3`

The Blighted Mountains tracker also reminds the player to approach a vane and press **E**.

### Control / interaction layout
The permanent controls legend has been moved into a compact footer at the very bottom of the viewport.

Interactive prompts now appear above the footer inside a high-contrast panel, making them easier to notice without covering the player or environment.

The first time the player reaches the Storm Vane section, the game explicitly announces:

`STORM VANES ARE INTERACTIVE  //  APPROACH A VANE + PRESS E TO ROTATE`


## v1.4 — Roster Expansion

The champion roster has grown to **10 playable classes**:

- Warrior
- Mage
- Rogue
- Paladin
- Archer
- Barbarian
- Fighter
- Monk
- Ranger
- Cleric

### Paged Champion Select
Champion Select now displays five characters at a time with Previous / Next controls.

This is intentionally future-proof: the remaining five original class identities can be added as Page 3 without making the menu taller or introducing scrolling/cutoff problems.

### Ranger
Hybrid hunter with:
- Marked Quarry every third shot,
- Hunter Sweep,
- Aimed Shot,
- Nature's Favor,
- Trail Step,
- Predator's Focus,
- Hunt resource.

### Cleric
Holy sustain/burst champion with:
- three-hit mace chain,
- Radiant Bolt,
- Smite,
- Rejuvenation,
- Sanctified Step,
- Divine Intervention,
- Grace resource.

### Movement Lab
- 9 switches to Ranger.
- 0 switches to Cleric.

### Audio
Five new effects support Ranger marking/nature abilities and Cleric holy/healing abilities.

### Remaining playable roster target
The five class identities still waiting for full implementation are:
Bard, Druid, Sorcerer, Warlock, and Wizard.


## v1.4.1 — World-edge safety patch

Runtime playtesting found that the champion could leave the playable world on the left while the camera remained at its x=0 limit.

v1.4.1 adds:
- invisible physical blockers at both campaign edges,
- a hard world-coordinate fail-safe,
- outward-velocity cancellation at the edge,
- player feedback when trying to leave the playable world.

This protects future high-speed movement abilities as well as the current roster.


## v1.4.2 — Safe NPC dialogue

Talking to a story NPC now freezes the entire gameplay world until the conversation is finished.

Enemies, bosses, active projectiles, hazards, moving platforms, and combat physics stop while dialogue is open. The dialogue UI remains active so **E** can advance the story.

After the final line, gameplay resumes and the champion receives 0.45 seconds of temporary invulnerability to prevent an immediate resume-frame hit.

ESC cannot toggle the regular pause menu during NPC dialogue.


## Complete Rough Draft v2.0

This milestone represents the complete gameplay/world-design draft before the dedicated final visual-production pass.

### Complete roster

All fifteen original champion identities are playable: Warrior, Mage, Rogue, Paladin, Archer, Barbarian, Fighter, Monk, Ranger, Cleric, Bard, Druid, Sorcerer, Warlock, and Wizard.

### Directional combat and aiming

Combat now uses an independent aim vector. Mouse position or the controller right stick can direct ranged attacks and melee hit volumes through 360 degrees. The existing J/K keyboard attacks remain available; left/right mouse buttons provide light/heavy attacks.

### Movement completion

S / Down crouches. Crouch + Dash performs a low slide. The standing collision capsule shrinks while crouched, allowing genuinely low passages that cannot be crossed while standing. Existing coyote time, jump buffering, variable jump, wall slide/wall jump, dashes, class movement, Rogue double jump, and attack buffering remain.

### Exploration architecture

The campaign remains fully playable along its main route, but every major region now contains optional interconnected routes. The Bellkeeper Undercrypt, Rootway, Drowned Aqueduct, Ashen Caves, and Black Tower Rift Gallery add tunnels, crawlspaces, portal links, alternate encounters, vertical platform routes, levers, permanent-in-run shortcut gates, and return paths.

### Accessibility / difficulty

The pause menu includes Story, Adventurer, and Legend damage profiles. Camera shake remains optional. Every champion can complete required progression; class abilities provide tactical identity rather than class-locking the campaign.

### Still intentionally rough

The remaining major production phase is the visual upgrade: authored character art/sprites, final animation sets, detailed environment art, final lighting/VFX, and release presentation. The mechanics and world-design draft are represented here for full-playthrough testing and refinement.


## v2.0.2 — Champion Select layout patch

- Rebuilt Champion Select pagination as three independent five-card grids.
- Replaced PREVIOUS/NEXT text buttons with compact arrow controls so navigation cannot overlap the page counter.
- Hides the unavailable direction arrow on the first/last page instead of drawing a disabled button beside the counter.
- Centers each five-champion page inside a 1040 px safe content area with larger side margins.
- Keeps the page counter in its own 300 px centered region.

This patch is based directly on the runtime screenshots from v2.0.


## v2.0.2 — Arcane Mirror feedback

Correctly aligned Arcane Mirrors now show a persistent world-space check mark, matching the Storm Vane puzzle. Correct rotations also produce an `ALIGNED` confirmation. The upper-right x/3 tracker intentionally remains visible because this is an alignment puzzle rather than a hidden combination lock.
