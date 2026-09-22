extends Node2D

var player: Hero
var hud: GameHUD
var boss: EvilWizardBoss
var miniboss: GraveKnight
var camera: Camera2D
var audio: AudioDirector
var shrine_village: CheckpointShrine
var shrine_gate: CheckpointShrine
var shrine_woods: CheckpointShrine
var forest_boss: BriarHart
var forest_left_gate: StonePlatform
var forest_right_gate: StonePlatform
var shrine_keep: CheckpointShrine
var keep_boss: DrownedCastellan
var keep_left_gate: StonePlatform
var keep_right_gate: StonePlatform
var cinema: CinematicDirector
var shrine_memory: CheckpointShrine
var memory_gate: MemoryGate
var labyrinth_runes: Array[RunePedestal] = []
var shrine_mountain: CheckpointShrine
var storm_gate: StormGate
var storm_vanes: Array[StormVane] = []
var mountain_boss: AshColossus
var mountain_left_gate: StonePlatform
var mountain_right_gate: StonePlatform
var shrine_tower: CheckpointShrine
var mirror_seal_door: MirrorSealDoor
var arcane_mirrors: Array[ArcaneMirror] = []
var tower_boss: ObsidianWarden
var tower_left_gate: StonePlatform
var tower_right_gate: StonePlatform
var shrine_crown: CheckpointShrine
var final_boss: TrueEvilWizard
var final_left_gate: StonePlatform
var final_right_gate: StonePlatform
var crown_sigils: Array[CrownSigil] = []

var boss_started: bool = false
var boss_defeated: bool = false
var miniboss_started: bool = false
var miniboss_defeated: bool = false
var checkpoint: Vector2 = Vector2(280,560)
var checkpoint_stage: int = 0
var left_gate: StonePlatform
var right_gate: StonePlatform
var miniboss_left_gate: StonePlatform
var miniboss_right_gate: StonePlatform
var camera_trauma: float = 0.0
var camera_shake_enabled: bool = true
var respawning: bool = false
var rng: RandomNumberGenerator = RandomNumberGenerator.new()
var shard_count: int = 0
var shard_total: int = 5
var village_announced: bool = false
var chapel_announced: bool = false
var selected_class: String = "warrior"
var collected_shard_ids: Array[String] = []
var upgrades: Array[String] = []
var claimed_shrines: Array[int] = []
var pending_shrine_stage: int = 0
var bellkeeper: StoryNPC
var dialogue_active: bool = false
var dialogue_index: int = 0
var woods_announced: bool = false
var forest_boss_started: bool = false
var forest_boss_defeated: bool = false
var keep_announced: bool = false
var keep_boss_started: bool = false
var keep_boss_defeated: bool = false
var labyrinth_announced: bool = false
var labyrinth_solved: bool = false
var labyrinth_progress: int = 0
var cutscene_active: bool = false
var mountain_announced: bool = false
var storm_gate_solved: bool = false
var storm_vane_tutorial_shown: bool = false
var mountain_boss_started: bool = false
var mountain_boss_defeated: bool = false
var tower_announced: bool = false
var mirror_seal_solved: bool = false
var tower_boss_started: bool = false
var tower_boss_defeated: bool = false
var crown_announced: bool = false
var final_boss_started: bool = false
var final_boss_defeated: bool = false
var travel_nodes: Array[WorldTravelNode] = []
var world_levers: Array[WorldLever] = []
var world_gates: Dictionary = {}
var travel_cooldown: float = 0.0

# Black Gate boss arena. Keep geometry and boss logic derived from the same values.
# Grave Knight arena. The trigger is deliberately well inside the left gate so
# the seal rises behind the player instead of appearing in front of them.
const MINIBOSS_LEFT_GATE_X: float = 4635.0
const MINIBOSS_RIGHT_GATE_X: float = 5460.0
const MINIBOSS_TRIGGER_X: float = 4860.0
const MINIBOSS_SPAWN_X: float = 5100.0

const BOSS_LEFT_GATE_X: float = 6700.0
const BOSS_RIGHT_GATE_X: float = 8120.0
const BOSS_GATE_WIDTH: float = 52.0
const BOSS_BODY_MARGIN: float = 28.0
const BOSS_ARENA_LEFT: float = BOSS_LEFT_GATE_X + (BOSS_GATE_WIDTH * 0.5) + BOSS_BODY_MARGIN
const BOSS_ARENA_RIGHT: float = BOSS_RIGHT_GATE_X - (BOSS_GATE_WIDTH * 0.5) - BOSS_BODY_MARGIN

const WOODS_LEFT: float = 8200.0
const WOODS_CHECKPOINT_X: float = 10100.0
const FOREST_BOSS_LEFT_GATE_X: float = 12650.0
const FOREST_BOSS_RIGHT_GATE_X: float = 14120.0
const FOREST_BOSS_TRIGGER_X: float = 12930.0
const FOREST_BOSS_ARENA_LEFT: float = 12705.0
const FOREST_BOSS_ARENA_RIGHT: float = 14065.0

const KEEP_LEFT: float = 14500.0
const KEEP_CHECKPOINT_X: float = 16540.0
const KEEP_BOSS_LEFT_GATE_X: float = 19770.0
const KEEP_BOSS_RIGHT_GATE_X: float = 21110.0
const KEEP_BOSS_TRIGGER_X: float = 20020.0
const KEEP_BOSS_ARENA_LEFT: float = 19825.0
const KEEP_BOSS_ARENA_RIGHT: float = 21055.0

const LABYRINTH_LEFT: float = 21450.0
const LABYRINTH_CHECKPOINT_X: float = 26440.0
const MEMORY_GATE_X: float = 26080.0
const LABYRINTH_EXIT_X: float = 26880.0

const MOUNTAIN_LEFT: float = 26880.0
const MOUNTAIN_CHECKPOINT_X: float = 33420.0
const STORM_GATE_X: float = 33080.0
const MOUNTAIN_BOSS_LEFT_GATE_X: float = 34320.0
const MOUNTAIN_BOSS_RIGHT_GATE_X: float = 35920.0
const MOUNTAIN_BOSS_TRIGGER_X: float = 34610.0
const MOUNTAIN_BOSS_ARENA_LEFT: float = 34375.0
const MOUNTAIN_BOSS_ARENA_RIGHT: float = 35865.0

const BLACK_TOWER_LEFT: float = 35920.0
const TOWER_CHECKPOINT_X: float = 43140.0
const MIRROR_SEAL_X: float = 42820.0
const TOWER_BOSS_LEFT_GATE_X: float = 43880.0
const TOWER_BOSS_RIGHT_GATE_X: float = 45720.0
const TOWER_BOSS_TRIGGER_X: float = 44180.0
const TOWER_BOSS_ARENA_LEFT: float = 43935.0
const TOWER_BOSS_ARENA_RIGHT: float = 45665.0

const CROWN_CHAMBER_LEFT: float = 45880.0
const CROWN_CHECKPOINT_X: float = 47980.0
const FINAL_BOSS_LEFT_GATE_X: float = 48720.0
const FINAL_BOSS_RIGHT_GATE_X: float = 51880.0
const FINAL_BOSS_TRIGGER_X: float = 49020.0
const FINAL_BOSS_ARENA_LEFT: float = 48775.0
const FINAL_BOSS_ARENA_RIGHT: float = 51825.0

# Hard world safety bounds. Camera limits alone do not stop CharacterBody2D
# movement, so these prevent a dash/run from leaving the playable world.
const WORLD_MIN_X: float = 48.0
const WORLD_MAX_X: float = 52720.0

func _ready() -> void:
    rng.randomize()
    _install_gamepad_defaults()
    audio = AudioDirector.new()
    add_child(audio)
    _build_world()
    _spawn_player()
    _spawn_initial_enemies()
    hud = GameHUD.new()
    add_child(hud)
    hud.bind_player(player)
    hud.set_shards(shard_count,shard_total)
    hud.set_objective("Cross the Fallen Village")
    hud.start_requested.connect(_on_start_requested)
    hud.continue_requested.connect(_on_continue_requested)
    hud.movement_lab_requested.connect(_on_movement_lab_requested)
    hud.shrine_upgrade_requested.connect(_on_shrine_upgrade_requested)
    hud.pause_toggled.connect(_on_pause_toggled)
    hud.restart_requested.connect(_on_restart_requested)
    hud.quit_requested.connect(_on_quit_requested)
    hud.shake_changed.connect(func(enabled: bool): camera_shake_enabled = enabled)
    hud.difficulty_changed.connect(_on_difficulty_changed)

    cinema = CinematicDirector.new()
    add_child(cinema)
    cinema.finished.connect(_on_cutscene_finished)
    cinema.sfx_requested.connect(_play_sfx)

    hud.set_continue_available(SaveSystem.has_save())
    hud.show_title()
    get_tree().paused = true

func _process(delta: float) -> void:
    if not is_instance_valid(player):
        return
    travel_cooldown = maxf(0.0,travel_cooldown-delta)
    _enforce_player_world_bounds()
    _update_camera(delta)
    _update_interactions()

    if not village_announced and player.global_position.x > 860.0:
        village_announced = true
        hud.announce("THE FALLEN VILLAGE  //  NOTHING HERE DIED CLEANLY",2.0)

    if not chapel_announced and player.global_position.x > 3020.0:
        chapel_announced = true
        hud.announce("THE OLD CHAPEL  //  THE BELLS HAVE BEEN SILENT FOR YEARS",2.0)

    if checkpoint_stage == 0 and player.global_position.x > 3480.0:
        checkpoint_stage = 1
        checkpoint = Vector2(3670,560)
        shrine_village.activate()
        audio.play_sfx("checkpoint",-5.0,1.0)
        hud.announce("VILLAGE SHRINE AWAKENED  //  CHECKPOINT",1.8)
        _offer_shrine_blessing(1)

    if not miniboss_started and not miniboss_defeated and player.global_position.x > MINIBOSS_TRIGGER_X:
        _start_miniboss()

    if miniboss_defeated and checkpoint_stage == 1 and player.global_position.x > 5740.0:
        checkpoint_stage = 2
        checkpoint = Vector2(5920,560)
        shrine_gate.activate()
        audio.play_sfx("checkpoint",-5.0,1.08)
        hud.announce("BLACK ROAD SHRINE AWAKENED  //  CHECKPOINT",1.8)
        _offer_shrine_blessing(2)

    if miniboss_defeated and not boss_started and not boss_defeated and player.global_position.x > 6750.0:
        _start_boss()
    if boss_defeated and not woods_announced and player.global_position.x > 8420.0:
        woods_announced = true
        hud.announce("THE WHISPERING WOODS  //  YOU KILLED ONLY MY SHADOW",2.4)
        hud.set_objective("Find the Heart of the Woods")

    if boss_defeated and checkpoint_stage < 3 and player.global_position.x > 9820.0:
        checkpoint_stage = 3
        checkpoint = Vector2(WOODS_CHECKPOINT_X,560)
        shrine_woods.activate()
        audio.play_sfx("checkpoint",-5.0,0.92)
        hud.announce("DEEPWOOD SHRINE AWAKENED  //  CHECKPOINT",1.8)
        _offer_shrine_blessing(3)

    if boss_defeated and not forest_boss_started and not forest_boss_defeated and player.global_position.x > FOREST_BOSS_TRIGGER_X:
        _start_forest_boss()

    if forest_boss_defeated and not keep_announced and player.global_position.x > 14620.0:
        keep_announced = true
        hud.announce("THE SUNKEN KEEP  //  EVERY STONE REMEMBERS THE DROWNING",2.5)
        hud.set_objective("Descend through the Sunken Keep")

    if forest_boss_defeated and checkpoint_stage < 4 and player.global_position.x > 16280.0:
        checkpoint_stage = 4
        checkpoint = Vector2(KEEP_CHECKPOINT_X,560)
        shrine_keep.activate()
        audio.play_sfx("checkpoint",-5.0,0.86)
        hud.announce("DROWNED SHRINE AWAKENED  //  CHECKPOINT",1.8)
        _offer_shrine_blessing(4)

    if forest_boss_defeated and not keep_boss_started and not keep_boss_defeated and player.global_position.x > KEEP_BOSS_TRIGGER_X:
        _start_keep_boss()

    if keep_boss_defeated and not labyrinth_announced and player.global_position.x > 21620.0:
        labyrinth_announced = true
        hud.set_objective("Solve the Memory Labyrinth")
        hud.announce("THE MEMORY LABYRINTH  //  THREE MEMORIES. ONE ORDER.",2.4)

    if keep_boss_defeated and labyrinth_solved and checkpoint_stage < 5 and player.global_position.x > 26260.0:
        checkpoint_stage = 5
        checkpoint = Vector2(LABYRINTH_CHECKPOINT_X,560)
        shrine_memory.activate()
        audio.play_sfx("checkpoint",-5.0,1.06)
        hud.announce("MEMORY SHRINE AWAKENED  //  CHECKPOINT",1.8)
        _offer_shrine_blessing(5)

    if labyrinth_solved and player.global_position.x > LABYRINTH_EXIT_X and not mountain_announced:
        mountain_announced = true
        hud.announce("THE BLIGHTED MOUNTAINS  //  EVEN THE WIND HAS TEETH",2.4)

    if labyrinth_solved and not storm_gate_solved and player.global_position.x > 28620.0:
        hud.set_objective("Align the three Storm Vanes")
        if not storm_vane_tutorial_shown:
            storm_vane_tutorial_shown = true
            hud.announce("STORM VANES ARE INTERACTIVE  //  APPROACH A VANE + PRESS F TO ROTATE",3.2)

    _update_context_tracker()

    if storm_gate_solved and checkpoint_stage < 6 and player.global_position.x > 33260.0:
        checkpoint_stage = 6
        checkpoint = Vector2(MOUNTAIN_CHECKPOINT_X,560)
        shrine_mountain.activate()
        audio.play_sfx("checkpoint",-5.0,0.82)
        hud.announce("SUMMIT SHRINE AWAKENED  //  CHECKPOINT",1.8)
        _offer_shrine_blessing(6)

    if storm_gate_solved and not mountain_boss_started and not mountain_boss_defeated and player.global_position.x > MOUNTAIN_BOSS_TRIGGER_X:
        _start_mountain_boss()

    if mountain_boss_defeated and not tower_announced and player.global_position.x > BLACK_TOWER_LEFT+180.0:
        tower_announced = true
        hud.announce("THE BLACK TOWER  //  THE WALLS ARE STILL LISTENING",2.4)
        hud.set_objective("Ascend the Lower Spire")

    if mountain_boss_defeated and not mirror_seal_solved and player.global_position.x > 38450.0:
        hud.set_objective("Align the three Arcane Mirrors")

    if mirror_seal_solved and checkpoint_stage < 7 and player.global_position.x > 42980.0:
        checkpoint_stage = 7
        checkpoint = Vector2(TOWER_CHECKPOINT_X,560)
        shrine_tower.activate()
        audio.play_sfx("checkpoint",-5.0,0.78)
        hud.announce("SPIRE SHRINE AWAKENED  //  CHECKPOINT",1.8)
        _offer_shrine_blessing(7)

    if mirror_seal_solved and not tower_boss_started and not tower_boss_defeated and player.global_position.x > TOWER_BOSS_TRIGGER_X:
        _start_tower_boss()

    if tower_boss_defeated and not crown_announced and player.global_position.x > CROWN_CHAMBER_LEFT+150.0:
        crown_announced = true
        hud.announce("THE CROWN CHAMBER  //  NO SHADOWS REMAIN",2.5)
        hud.set_objective("Reach the Shrine Beneath the Crown")

    if tower_boss_defeated and checkpoint_stage < 8 and player.global_position.x > 47780.0:
        checkpoint_stage = 8
        checkpoint = Vector2(CROWN_CHECKPOINT_X,560)
        shrine_crown.activate()
        audio.play_sfx("checkpoint",-4.0,0.76)
        hud.announce("CROWN SHRINE AWAKENED  //  FINAL CHECKPOINT",2.0)
        _offer_shrine_blessing(8)

    if tower_boss_defeated and not final_boss_started and not final_boss_defeated and player.global_position.x > FINAL_BOSS_TRIGGER_X:
        _start_true_wizard()

    if final_boss_defeated:
        hud.set_objective("The realm breathes again")

    _update_music_context()

func _build_world() -> void:
    add_child(RuinedBackdrop.new())
    add_child(RealmAtmosphere.new())
    add_child(WhisperingWoodsBackdrop.new())
    add_child(SunkenKeepBackdrop.new())
    add_child(LabyrinthBackdrop.new())
    add_child(MountainVista.new())
    add_child(BlightedMountainsBackdrop.new())
    add_child(BlackTowerBackdrop.new())
    add_child(CrownChamberBackdrop.new())
    _platform(Vector2(4100,650),Vector2(8200,140),Color("#202a31"))
    _platform(Vector2(11350,650),Vector2(6300,140),Color("#18261f"))
    _platform(Vector2(17975,650),Vector2(6950,140),Color("#17252b"))
    _platform(Vector2(24700,650),Vector2(6500,140),Color("#211d2a"))
    _platform(Vector2(27560,650),Vector2(1300,140),Color("#29232b"))
    _platform(Vector2(32300,650),Vector2(8200,140),Color("#29242b"))
    _platform(Vector2(41120,650),Vector2(10560,140),Color("#17131d"))
    _platform(Vector2(49500,650),Vector2(6800,140),Color("#17121c"))

    # Invisible edge blockers. The hard position clamp above is a second layer
    # for high-speed dashes or future movement abilities.
    var left_world_blocker: StonePlatform = _platform(Vector2(-26,300),Vector2(52,900),Color(0,0,0,0))
    left_world_blocker.visible = false
    var right_world_blocker: StonePlatform = _platform(Vector2(52774,300),Vector2(52,900),Color(0,0,0,0))
    right_world_blocker.visible = false

    # Fallen Village traversal route.
    _platform(Vector2(690,500),Vector2(260,36))
    _platform(Vector2(1110,420),Vector2(220,36))
    _platform(Vector2(1480,515),Vector2(260,36))
    _platform(Vector2(1870,392),Vector2(240,36))
    _platform(Vector2(2250,492),Vector2(190,36))
    _platform(Vector2(2580,385),Vector2(220,36))
    _platform(Vector2(2920,310),Vector2(180,32),Color("#30353b"))
    _platform(Vector2(3260,455),Vector2(250,34))
    _platform(Vector2(3710,390),Vector2(250,36))
    _platform(Vector2(4090,500),Vector2(210,34))
    _platform(Vector2(4440,415),Vector2(210,34))

    # Gatehouse arena and post-miniboss approach.
    _platform(Vector2(5050,472),Vector2(330,32),Color("#2f3337"))
    _platform(Vector2(5630,390),Vector2(220,34))
    _platform(Vector2(6060,490),Vector2(280,34))
    _platform(Vector2(6420,385),Vector2(220,34))

    # Black Tower arena platforms.
    _platform(Vector2(7180,474),Vector2(260,30),Color("#31263b"))
    _platform(Vector2(7520,365),Vector2(220,30),Color("#31263b"))
    _platform(Vector2(7850,468),Vector2(220,30),Color("#31263b"))

    # Whispering Woods traversal.
    _platform(Vector2(8420,492),Vector2(250,34),Color("#263a2f"))
    _platform(Vector2(8790,390),Vector2(210,32),Color("#274035"))
    _platform(Vector2(9180,480),Vector2(260,34),Color("#293d31"))
    _platform(Vector2(9580,350),Vector2(200,32),Color("#2c4435"))
    _platform(Vector2(10020,455),Vector2(260,34),Color("#2c4435"))
    _platform(Vector2(10480,370),Vector2(220,32),Color("#2b4033"))
    _platform(Vector2(10920,500),Vector2(280,34),Color("#293b30"))
    _platform(Vector2(11380,400),Vector2(210,32),Color("#2b4134"))
    _platform(Vector2(11810,315),Vector2(180,30),Color("#31483a"))
    _platform(Vector2(12180,455),Vector2(250,34),Color("#2b4033"))
    _platform(Vector2(12510,380),Vector2(190,32),Color("#2d4435"))
    _platform(Vector2(13010,460),Vector2(250,32),Color("#314434"))
    _platform(Vector2(13400,350),Vector2(230,30),Color("#314434"))
    _platform(Vector2(13820,470),Vector2(240,32),Color("#314434"))

    _hazard(Vector2(8700,574),Vector2(170,28))
    _hazard(Vector2(10300,574),Vector2(190,28))
    _hazard(Vector2(11610,574),Vector2(160,28))
    _hazard(Vector2(12320,574),Vector2(180,28))

    shrine_woods = CheckpointShrine.new().setup(Vector2(WOODS_CHECKPOINT_X,573))
    add_child(shrine_woods)

    _woods_prop("tree",Vector2(8360,592),1.10,false)
    _woods_prop("mushrooms",Vector2(8870,592),1.0,true)
    _woods_prop("stone",Vector2(9470,592),0.92,true)
    _woods_prop("tree",Vector2(10420,592),1.22,false)
    _woods_prop("lantern",Vector2(11080,592),1.0,true)
    _woods_prop("mushrooms",Vector2(11920,592),1.20,true)
    _woods_prop("tree",Vector2(12420,592),1.35,false)
    _woods_prop("stone",Vector2(12840,592),1.05,true)
    _woods_prop("tree",Vector2(13940,592),1.15,false)

    # Sunken Keep traversal.
    _platform(Vector2(14660,490),Vector2(250,32),Color("#31444a"))
    _platform(Vector2(15030,380),Vector2(210,30),Color("#34474e"))
    _platform(Vector2(15420,470),Vector2(230,32),Color("#31444a"))
    _platform(Vector2(15830,335),Vector2(190,30),Color("#384d53"))
    _platform(Vector2(16230,455),Vector2(250,32),Color("#34484f"))
    _platform(Vector2(16720,360),Vector2(200,30),Color("#354a51"))
    _platform(Vector2(17120,500),Vector2(260,32),Color("#31444a"))
    _platform(Vector2(17560,395),Vector2(220,30),Color("#364b51"))
    _platform(Vector2(18040,305),Vector2(185,30),Color("#3a5056"))
    _platform(Vector2(18460,455),Vector2(250,32),Color("#34484f"))
    _platform(Vector2(18920,350),Vector2(220,30),Color("#374c53"))
    _platform(Vector2(19380,475),Vector2(250,32),Color("#34484f"))
    _platform(Vector2(19860,380),Vector2(210,30),Color("#3a5056"))
    _platform(Vector2(20320,470),Vector2(240,32),Color("#374c53"))
    _platform(Vector2(20760,350),Vector2(210,30),Color("#394f55"))

    _moving_platform(Vector2(15120,520),Vector2(15120,300),2.1,Vector2(150,24))
    _moving_platform(Vector2(17770,520),Vector2(18000,390),2.6,Vector2(160,24))
    _moving_platform(Vector2(19120,510),Vector2(19120,270),2.35,Vector2(150,24))

    _keep_trap("spikes",Vector2(14840,582),0.0)
    _keep_trap("rune",Vector2(15610,560),0.4)
    _keep_trap("crusher",Vector2(16940,560),0.8)
    _keep_trap("spikes",Vector2(17360,582),1.2)
    _keep_trap("rune",Vector2(18260,560),1.6)
    _keep_trap("crusher",Vector2(18720,560),2.0)
    _keep_trap("spikes",Vector2(19490,582),2.4)

    shrine_keep = CheckpointShrine.new().setup(Vector2(KEEP_CHECKPOINT_X,573))
    add_child(shrine_keep)

    _keep_prop("arch",Vector2(14560,590),1.05)
    _keep_prop("torch",Vector2(14930,590),1.0)
    _keep_prop("statue",Vector2(15510,590),0.94)
    _keep_prop("rubble",Vector2(16010,590),1.0)
    _keep_prop("torch",Vector2(16590,590),0.96)
    _keep_prop("arch",Vector2(17220,590),1.08)
    _keep_prop("statue",Vector2(17940,590),1.06)
    _keep_prop("torch",Vector2(18540,590),1.0)
    _keep_prop("rubble",Vector2(19190,590),1.1)
    _keep_prop("arch",Vector2(19710,590),1.10)
    _keep_prop("torch",Vector2(20520,590),1.0)

    # The Memory Labyrinth: a side-view maze with upper/lower routes and deliberate backtracking.
    _platform(Vector2(21670,485),Vector2(260,32),Color("#353043"))
    _platform(Vector2(22060,370),Vector2(220,30),Color("#3a334a"))
    _platform(Vector2(22480,505),Vector2(250,32),Color("#332e40"))
    _platform(Vector2(22900,345),Vector2(200,30),Color("#3b344c"))
    _platform(Vector2(23300,455),Vector2(230,32),Color("#383146"))
    _platform(Vector2(23740,300),Vector2(190,30),Color("#403751"))
    _platform(Vector2(24160,475),Vector2(260,32),Color("#363044"))
    _platform(Vector2(24610,360),Vector2(210,30),Color("#3d354d"))
    _platform(Vector2(25020,505),Vector2(250,32),Color("#342e41"))
    _platform(Vector2(25450,330),Vector2(200,30),Color("#40374f"))
    _platform(Vector2(25850,455),Vector2(230,32),Color("#383146"))
    _platform(Vector2(26310,380),Vector2(220,30),Color("#3a3349"))
    _platform(Vector2(26760,500),Vector2(260,32),Color("#342f40"))

    # Maze walls create dead ends and force vertical routing.
    _platform(Vector2(22230,360),Vector2(46,430),Color("#2c2838"))
    _platform(Vector2(23110,310),Vector2(46,520),Color("#2c2838"))
    _platform(Vector2(24340,345),Vector2(46,470),Color("#2d293a"))
    _platform(Vector2(25250,310),Vector2(46,520),Color("#2d293a"))

    _moving_platform(Vector2(22670,530),Vector2(22670,300),2.25,Vector2(150,24))
    _moving_platform(Vector2(23520,520),Vector2(23800,390),2.60,Vector2(160,24))
    _moving_platform(Vector2(24820,520),Vector2(24820,275),2.30,Vector2(150,24))

    _keep_trap("rune",Vector2(21880,560),0.4)
    _keep_trap("spikes",Vector2(22770,582),0.8)
    _keep_trap("rune",Vector2(23960,560),1.2)
    _keep_trap("spikes",Vector2(24780,582),1.6)
    _keep_trap("rune",Vector2(25620,560),2.0)

    # Puzzle pedestals: the order is taught through story, mural, and world history.
    _rune_pedestal("bell",Vector2(22490,560))
    _rune_pedestal("moon",Vector2(23800,255))
    _rune_pedestal("crown",Vector2(25020,560))

    memory_gate = MemoryGate.new().setup(Vector2(MEMORY_GATE_X,300),Vector2(58,900))
    add_child(memory_gate)

    shrine_memory = CheckpointShrine.new().setup(Vector2(LABYRINTH_CHECKPOINT_X,573))
    add_child(shrine_memory)

    # Blighted Mountains — ascent, gusts, collapsing stone, and storm-vane puzzle.
    _platform(Vector2(27480,500),Vector2(250,32),Color("#484149"))
    _platform(Vector2(27920,390),Vector2(210,30),Color("#4d454d"))
    _platform(Vector2(28360,470),Vector2(250,32),Color("#4a424a"))
    _platform(Vector2(28810,330),Vector2(190,30),Color("#504750"))
    _platform(Vector2(29250,455),Vector2(240,32),Color("#4b434b"))
    _platform(Vector2(29710,350),Vector2(210,30),Color("#514850"))
    _platform(Vector2(30180,500),Vector2(270,32),Color("#4b434b"))
    _platform(Vector2(30640,365),Vector2(210,30),Color("#514850"))
    _platform(Vector2(31100,455),Vector2(245,32),Color("#4b434b"))
    _platform(Vector2(31560,320),Vector2(190,30),Color("#554b53"))
    _platform(Vector2(32010,485),Vector2(250,32),Color("#4b434b"))
    _platform(Vector2(32480,380),Vector2(220,30),Color("#514850"))
    _platform(Vector2(32910,500),Vector2(240,32),Color("#4b434b"))
    _platform(Vector2(33480,455),Vector2(260,32),Color("#514850"))
    _platform(Vector2(33940,345),Vector2(210,30),Color("#554b53"))
    _platform(Vector2(34620,475),Vector2(250,32),Color("#514850"))
    _platform(Vector2(35120,355),Vector2(220,30),Color("#554b53"))
    _platform(Vector2(35610,470),Vector2(250,32),Color("#514850"))

    _collapsing_platform(Vector2(28130,535),Vector2(165,26))
    _collapsing_platform(Vector2(29470,530),Vector2(170,26))
    _collapsing_platform(Vector2(30880,515),Vector2(160,26))
    _collapsing_platform(Vector2(32220,525),Vector2(170,26))

    _mountain_wind(Vector2(28640,360),Vector2(620,340),1.0,520.0)
    _mountain_wind(Vector2(30200,350),Vector2(720,360),-1.0,590.0)
    _mountain_wind(Vector2(31880,340),Vector2(700,360),1.0,650.0)

    _storm_vane("sunrise",Vector2(29120,560),1)
    _storm_vane("sunset",Vector2(30680,560),3)
    _storm_vane("summit",Vector2(32160,560),0)

    storm_gate = StormGate.new().setup(Vector2(STORM_GATE_X,300),Vector2(64,900))
    add_child(storm_gate)

    shrine_mountain = CheckpointShrine.new().setup(Vector2(MOUNTAIN_CHECKPOINT_X,573))
    add_child(shrine_mountain)

    # Black Tower — Lower Spire.
    _platform(Vector2(36280,500),Vector2(250,32),Color("#3b3244"))
    _platform(Vector2(36720,385),Vector2(210,30),Color("#43374d"))
    _platform(Vector2(37150,500),Vector2(250,32),Color("#3d3346"))
    _platform(Vector2(37600,335),Vector2(190,30),Color("#493b53"))
    _platform(Vector2(38060,455),Vector2(235,32),Color("#41364b"))
    _platform(Vector2(38510,350),Vector2(205,30),Color("#4a3c54"))
    _platform(Vector2(38950,505),Vector2(245,32),Color("#40354a"))
    _platform(Vector2(39420,375),Vector2(220,30),Color("#493b53"))
    _platform(Vector2(39880,490),Vector2(250,32),Color("#40354a"))
    _platform(Vector2(40330,325),Vector2(190,30),Color("#4b3d56"))
    _platform(Vector2(40780,455),Vector2(230,32),Color("#42364b"))
    _platform(Vector2(41240,365),Vector2(210,30),Color("#493b53"))
    _platform(Vector2(41700,500),Vector2(250,32),Color("#40354a"))
    _platform(Vector2(42160,350),Vector2(210,30),Color("#4b3d56"))
    _platform(Vector2(42610,490),Vector2(240,32),Color("#40354a"))
    _platform(Vector2(43200,445),Vector2(250,32),Color("#473a50"))
    _platform(Vector2(43630,330),Vector2(190,30),Color("#4f4058"))
    _platform(Vector2(44320,475),Vector2(250,32),Color("#493a51"))
    _platform(Vector2(44820,350),Vector2(220,30),Color("#50415a"))
    _platform(Vector2(45320,475),Vector2(250,32),Color("#493a51"))

    # Arcane elevators turn the tower into a vertical-feeling ascent.
    _tower_elevator(Vector2(36510,540),Vector2(36510,300),2.4,Vector2(165,26))
    _tower_elevator(Vector2(38280,530),Vector2(38280,265),2.7,Vector2(170,26))
    _tower_elevator(Vector2(40110,525),Vector2(40110,255),2.5,Vector2(160,26))
    _tower_elevator(Vector2(41920,530),Vector2(41920,285),2.8,Vector2(170,26))

    # Phase platforms disappear on a visible rhythm.
    _phase_platform(Vector2(36930,530),Vector2(165,26),0.0)
    _phase_platform(Vector2(38740,530),Vector2(170,26),0.65)
    _phase_platform(Vector2(40550,525),Vector2(160,26),1.30)
    _phase_platform(Vector2(42380,530),Vector2(170,26),1.95)

    # Mirror Vault puzzle.
    _arcane_mirror("moon",Vector2(39230,560),0)
    _arcane_mirror("heart",Vector2(40780,560),1)
    _arcane_mirror("road",Vector2(42280,560),3)

    mirror_seal_door = MirrorSealDoor.new().setup(Vector2(MIRROR_SEAL_X,300),Vector2(66,900))
    add_child(mirror_seal_door)

    shrine_tower = CheckpointShrine.new().setup(Vector2(TOWER_CHECKPOINT_X,573))
    add_child(shrine_tower)

    # Crown Chamber approach and final arena.
    _platform(Vector2(46180,500),Vector2(260,32),Color("#4a394f"))
    _platform(Vector2(46620,390),Vector2(220,30),Color("#523d58"))
    _platform(Vector2(47080,485),Vector2(250,32),Color("#4b394f"))
    _platform(Vector2(47520,350),Vector2(210,30),Color("#563f5d"))
    _platform(Vector2(48020,470),Vector2(270,32),Color("#4b394f"))
    _platform(Vector2(48460,365),Vector2(210,30),Color("#563f5d"))

    shrine_crown = CheckpointShrine.new().setup(Vector2(CROWN_CHECKPOINT_X,573))
    add_child(shrine_crown)

    # Final arena platforms: one central perch is used by a Crown Sigil in Phase II.
    _platform(Vector2(49420,470),Vector2(250,32),Color("#4c3753"))
    _platform(Vector2(50330,445),Vector2(260,32),Color("#583d60"))
    _platform(Vector2(51240,470),Vector2(250,32),Color("#4c3753"))
    _platform(Vector2(49880,330),Vector2(190,28),Color("#62446a"))
    _platform(Vector2(50780,330),Vector2(190,28),Color("#62446a"))

    _hazard(Vector2(1320,574),Vector2(170,28))
    _hazard(Vector2(2390,574),Vector2(190,28))
    _hazard(Vector2(3930,574),Vector2(165,28))
    _hazard(Vector2(5520,574),Vector2(180,28))
    _hazard(Vector2(6500,574),Vector2(180,28))

    shrine_village = CheckpointShrine.new().setup(Vector2(3670,573))
    add_child(shrine_village)
    shrine_gate = CheckpointShrine.new().setup(Vector2(5920,573))
    add_child(shrine_gate)

    # Village silhouettes and landmarks close to the playable road.
    _prop("house",Vector2(520,575),0.92,true)
    _prop("cart",Vector2(1010,586),0.85,false)
    _prop("house",Vector2(1570,575),1.05,false)
    _prop("lamp",Vector2(2050,580),1.0,true)
    _prop("well",Vector2(2520,586),0.90,false)
    _prop("chapel",Vector2(3210,575),0.92,true)
    _prop("house",Vector2(4040,575),0.88,false)
    _prop("lamp",Vector2(4380,580),0.94,false)

    # Five optional shards reward exploration and alternate platform routes.
    _spawn_shard("village_roof",Vector2(1110,365))
    _spawn_shard("broken_house",Vector2(1870,335))
    _spawn_shard("chapel_spire",Vector2(2920,255))
    _spawn_shard("warden_road",Vector2(4440,360))
    _spawn_shard("black_road",Vector2(6420,330))

    bellkeeper = StoryNPC.new().setup(
        Vector2(2790,560),
        player,
        "Mara, Bellkeeper",
        [
            "I rang the chapel bell the night the Wizard came. It answered from beneath the earth.",
            "The Grave Knight was once our gate warden. Do not mistake what remains of him for the man he was.",
            "If the road shrines still answer you, choose carefully. They remember every blessing they give."
        ]
    )
    add_child(bellkeeper)

    _build_exploration_layers()

func _build_exploration_layers() -> void:
    # FALLEN VILLAGE — Bellkeeper Undercrypt. A low tunnel teaches crouching.
    _platform(Vector2(2350,1650),Vector2(3000,140),Color("#171d20"))
    _platform(Vector2(1850,1450),Vector2(260,28),Color("#30383b"))
    _platform(Vector2(2420,1390),Vector2(220,28),Color("#30383b"))
    _platform(Vector2(2920,1460),Vector2(250,28),Color("#30383b"))
    _platform(Vector2(2200,1515),Vector2(560,30),Color("#20272a")) # low crawl ceiling
    _travel_node("village_down",Vector2(1580,560),Vector2(1180,1580),"BELLKEEPER UNDERCRYPT","tunnel")
    _travel_node("village_up",Vector2(3380,1580),Vector2(3380,560),"VILLAGE CHAPEL","tunnel")
    _world_gate("village_shortcut",Vector2(3060,1540),Vector2(46,190))
    _world_lever("village_shortcut",Vector2(2820,1580))

    # WHISPERING WOODS — Rootway loop under the forest.
    _platform(Vector2(10550,1650),Vector2(3300,140),Color("#14221b"))
    _platform(Vector2(9600,1460),Vector2(230,28),Color("#294133"))
    _platform(Vector2(10320,1360),Vector2(210,28),Color("#294133"))
    _platform(Vector2(11100,1460),Vector2(240,28),Color("#294133"))
    _platform(Vector2(11620,1370),Vector2(190,28),Color("#294133"))
    _travel_node("woods_down",Vector2(9150,560),Vector2(9100,1580),"THE ROOTWAY","tunnel")
    _travel_node("woods_up",Vector2(12050,1580),Vector2(12050,560),"DEEPWOOD CLEARING","tunnel")
    _world_gate("woods_shortcut",Vector2(11480,1540),Vector2(46,190))
    _world_lever("woods_shortcut",Vector2(11020,1580))

    # SUNKEN KEEP — drowned aqueduct with a portal bypass loop.
    _platform(Vector2(17150,1650),Vector2(4500,140),Color("#122329"))
    _platform(Vector2(15780,1450),Vector2(240,28),Color("#31484f"))
    _platform(Vector2(16650,1350),Vector2(220,28),Color("#31484f"))
    _platform(Vector2(17620,1450),Vector2(250,28),Color("#31484f"))
    _platform(Vector2(18620,1360),Vector2(210,28),Color("#31484f"))
    _travel_node("keep_down",Vector2(15120,560),Vector2(15120,1580),"DROWNED AQUEDUCT","tunnel")
    _travel_node("keep_up",Vector2(19220,1580),Vector2(19220,560),"KEEP ARMORY","tunnel")
    _travel_node("keep_portal_a",Vector2(16200,1580),Vector2(18350,1580),"FAR CISTERN","portal")
    _travel_node("keep_portal_b",Vector2(18350,1580),Vector2(16200,1580),"NEAR CISTERN","portal")

    # BLIGHTED MOUNTAINS — cave route; a safer but longer alternative to exposed wind.
    _platform(Vector2(30300,1650),Vector2(5000,140),Color("#252126"))
    _platform(Vector2(28780,1450),Vector2(230,28),Color("#4a424a"))
    _platform(Vector2(29800,1350),Vector2(220,28),Color("#4a424a"))
    _platform(Vector2(30920,1450),Vector2(250,28),Color("#4a424a"))
    _platform(Vector2(31900,1360),Vector2(210,28),Color("#4a424a"))
    _travel_node("mountain_down",Vector2(28280,560),Vector2(28280,1580),"ASHEN CAVES","tunnel")
    _travel_node("mountain_up",Vector2(32500,1580),Vector2(32500,560),"SUMMIT APPROACH","tunnel")
    _world_gate("mountain_shortcut",Vector2(31680,1540),Vector2(46,190))
    _world_lever("mountain_shortcut",Vector2(31220,1580))

    # BLACK TOWER — a rift gallery that folds space and rewards portal literacy.
    _platform(Vector2(39800,1650),Vector2(6000,140),Color("#130f18"))
    _platform(Vector2(37800,1450),Vector2(240,28),Color("#40354a"))
    _platform(Vector2(39000,1340),Vector2(220,28),Color("#493b53"))
    _platform(Vector2(40300,1450),Vector2(250,28),Color("#40354a"))
    _platform(Vector2(41600,1350),Vector2(210,28),Color("#493b53"))
    _travel_node("tower_rift_in",Vector2(37150,560),Vector2(37150,1580),"RIFT GALLERY","portal")
    _travel_node("tower_rift_mid_a",Vector2(38400,1580),Vector2(40700,1580),"FOLDED HALL","portal")
    _travel_node("tower_rift_mid_b",Vector2(40700,1580),Vector2(38400,1580),"LOWER RIFT","portal")
    _travel_node("tower_rift_out",Vector2(42550,1580),Vector2(42550,560),"MIRROR VAULT","portal")

func _travel_node(id_value: String, at: Vector2, destination: Vector2, destination_name: String, kind: String) -> void:
    var node: WorldTravelNode = WorldTravelNode.new().setup(id_value,at,destination,destination_name,kind,player)
    travel_nodes.append(node)
    add_child(node)

func _world_gate(id_value: String, at: Vector2, size_value: Vector2) -> void:
    var gate: WorldGate = WorldGate.new().setup(id_value,at,size_value)
    world_gates[id_value]=gate
    add_child(gate)

func _world_lever(id_value: String, at: Vector2) -> void:
    var lever: WorldLever = WorldLever.new().setup(id_value,at,player)
    world_levers.append(lever)
    add_child(lever)

func _use_travel_node(node: WorldTravelNode) -> void:
    travel_cooldown=0.75
    player.global_position=node.destination
    player.velocity=Vector2.ZERO
    player.invulnerable=maxf(player.invulnerable,0.70)
    audio.play_sfx("teleport",-7.0,0.86 if node.kind=="tunnel" else 1.12)
    _spawn_flash(player.global_position+Vector2(0,-28),Color("#9ddcff") if node.kind=="tunnel" else Color("#c28cff"))
    hud.announce("%s  //  %s" % [("PASSAGE" if node.kind=="tunnel" else "ARCANE TRANSIT"),node.destination_name.to_upper()],1.2)

func _activate_world_lever(lever: WorldLever) -> void:
    if not lever.activate():
        return
    var gate = world_gates.get(lever.lever_id)
    if gate is WorldGate and is_instance_valid(gate):
        (gate as WorldGate).open_gate()
    audio.play_sfx("gate_open",-5.0,1.06)
    hud.announce("SHORTCUT OPENED  //  THE WORLD REMEMBERS",1.5)

func _on_difficulty_changed(mode: String) -> void:
    if not is_instance_valid(player):
        return
    if mode=="story":
        player.incoming_damage_multiplier=0.70
        hud.announce("STORY DIFFICULTY  //  DAMAGE REDUCED",1.2)
    elif mode=="legend":
        player.incoming_damage_multiplier=1.25
        hud.announce("LEGEND DIFFICULTY  //  ENEMIES HIT HARDER",1.2)
    else:
        player.incoming_damage_multiplier=1.0
        hud.announce("ADVENTURER DIFFICULTY  //  INTENDED BALANCE",1.2)

func _woods_prop(kind: String, at: Vector2, scale_value: float = 1.0, glowing: bool = false) -> void:
    var prop: WoodsProp = WoodsProp.new().setup(kind,at,scale_value,glowing)
    add_child(prop)

func _rune_pedestal(rune_id: String, at: Vector2) -> void:
    var pedestal: RunePedestal = RunePedestal.new().setup(rune_id,at,player)
    labyrinth_runes.append(pedestal)
    add_child(pedestal)

func _mountain_wind(at: Vector2, size_value: Vector2, direction: float, force: float) -> void:
    var wind: MountainWindZone = MountainWindZone.new().setup(at,size_value,direction,force,player)
    add_child(wind)
    wind.sfx_requested.connect(_play_sfx)

func _collapsing_platform(at: Vector2, size_value: Vector2) -> void:
    var platform: CollapsingMountainPlatform = CollapsingMountainPlatform.new().setup(at,size_value,player)
    add_child(platform)
    platform.sfx_requested.connect(_play_sfx)

func _storm_vane(vane_id: String, at: Vector2, target_orientation: int) -> void:
    var vane: StormVane = StormVane.new().setup(vane_id,at,target_orientation,player)
    storm_vanes.append(vane)
    add_child(vane)

func _tower_elevator(a: Vector2, b: Vector2, seconds: float, size_value: Vector2) -> void:
    var elevator: ArcaneElevator = ArcaneElevator.new().setup(a,b,seconds,size_value)
    add_child(elevator)

func _phase_platform(at: Vector2, size_value: Vector2, offset: float) -> void:
    var platform: PhasePlatform = PhasePlatform.new().setup(at,size_value,offset)
    add_child(platform)
    platform.sfx_requested.connect(_play_sfx)

func _arcane_mirror(mirror_id: String, at: Vector2, target_orientation: int) -> void:
    var mirror: ArcaneMirror = ArcaneMirror.new().setup(mirror_id,at,target_orientation,player)
    arcane_mirrors.append(mirror)
    add_child(mirror)

func _keep_prop(kind: String, at: Vector2, scale_value: float = 1.0) -> void:
    var prop: KeepProp = KeepProp.new().setup(kind,at,scale_value)
    add_child(prop)

func _moving_platform(a: Vector2, b: Vector2, seconds: float, size_value: Vector2) -> void:
    var platform: MovingKeepPlatform = MovingKeepPlatform.new().setup(a,b,seconds,size_value)
    add_child(platform)

func _keep_trap(kind: String, at: Vector2, phase: float = 0.0) -> void:
    var trap: KeepTrap = KeepTrap.new().setup(kind,at,null,phase)
    add_child(trap)
    trap.sfx_requested.connect(_play_sfx)

func _hazard(center: Vector2, size: Vector2) -> void:
    var hazard: RuneHazard = RuneHazard.new().setup(center,size)
    add_child(hazard)

func _prop(kind: String, at: Vector2, size_scale: float = 1.0, warm: bool = false) -> void:
    var prop: VillageProp = VillageProp.new().setup(kind,at,size_scale,warm)
    add_child(prop)

func _platform(center: Vector2, size: Vector2, color: Color = Color("#27323b")) -> StonePlatform:
    var platform: StonePlatform = StonePlatform.new().setup(center,size,color)
    add_child(platform)
    return platform

func _spawn_shard(shard_id: String, at: Vector2) -> void:
    var shard: ArcaneShard = ArcaneShard.new().setup(at,shard_id)
    add_child(shard)
    shard.collected.connect(_on_shard_collected)

func _spawn_player() -> void:
    player = Hero.new()
    player.global_position = checkpoint
    add_child(player)
    player.died.connect(_on_player_died)
    player.request_flash.connect(_spawn_flash)
    player.damage_text_requested.connect(_spawn_damage_text)
    player.sfx_requested.connect(_play_sfx)

    camera = Camera2D.new()
    camera.position = Vector2(120,-90)
    camera.position_smoothing_enabled = true
    camera.position_smoothing_speed = 6.5
    camera.limit_left = 0
    camera.limit_right = 52800
    camera.limit_top = -120
    camera.limit_bottom = 1920
    player.add_child(camera)

func _spawn_initial_enemies() -> void:
    _spawn_enemy("crawler",Vector2(900,560))
    _spawn_enemy("wisp",Vector2(1370,560))
    _spawn_enemy("sentinel",Vector2(1760,560))
    _spawn_enemy("crawler",Vector2(2210,560))
    _spawn_enemy("wisp",Vector2(2740,560))
    _spawn_enemy("sentinel",Vector2(3370,560))
    _spawn_enemy("crawler",Vector2(3970,560))
    _spawn_enemy("wisp",Vector2(4260,560))
    _spawn_enemy("sentinel",Vector2(6100,560))
    _spawn_enemy("crawler",Vector2(6390,560))
    _spawn_forest_enemy("briarling",Vector2(8650,560))
    _spawn_forest_enemy("gloom_moth",Vector2(9300,420))
    _spawn_forest_enemy("root_guard",Vector2(9870,560))
    _spawn_forest_enemy("briarling",Vector2(10680,560))
    _spawn_forest_enemy("gloom_moth",Vector2(11240,400))
    _spawn_forest_enemy("root_guard",Vector2(12020,560))
    _spawn_forest_enemy("briarling",Vector2(12480,560))
    _spawn_keep_enemy("drowned_guard",Vector2(14780,560))
    _spawn_keep_enemy("crypt_leech",Vector2(15320,560))
    _spawn_keep_enemy("rune_caster",Vector2(15940,560))
    _spawn_keep_enemy("drowned_guard",Vector2(16640,560))
    _spawn_keep_enemy("crypt_leech",Vector2(17280,560))
    _spawn_keep_enemy("rune_caster",Vector2(18110,560))
    _spawn_keep_enemy("drowned_guard",Vector2(18840,560))
    _spawn_keep_enemy("crypt_leech",Vector2(19410,560))
    _spawn_mountain_enemy("ash_hound",Vector2(27680,560))
    _spawn_mountain_enemy("storm_shaman",Vector2(28480,560))
    _spawn_mountain_enemy("stone_raider",Vector2(29560,560))
    _spawn_mountain_enemy("ash_hound",Vector2(30320,560))
    _spawn_mountain_enemy("storm_shaman",Vector2(31280,560))
    _spawn_mountain_enemy("stone_raider",Vector2(32280,560))
    _spawn_mountain_enemy("ash_hound",Vector2(33740,560))
    _spawn_tower_enemy("void_sentry",Vector2(36380,560))
    _spawn_tower_enemy("arcane_eye",Vector2(37480,560))
    _spawn_tower_enemy("shadow_knight",Vector2(38620,560))
    _spawn_tower_enemy("void_sentry",Vector2(39780,560))
    _spawn_tower_enemy("arcane_eye",Vector2(40980,560))
    _spawn_tower_enemy("shadow_knight",Vector2(42080,560))
    _spawn_tower_enemy("void_sentry",Vector2(43380,560))

    # Optional branch encounters: underground routes are rewarding, never required.
    _spawn_enemy("crawler",Vector2(1900,1580))
    _spawn_enemy("sentinel",Vector2(2750,1580))
    _spawn_forest_enemy("briarling",Vector2(9800,1580))
    _spawn_forest_enemy("gloom_moth",Vector2(10850,1420))
    _spawn_keep_enemy("crypt_leech",Vector2(16500,1580))
    _spawn_keep_enemy("rune_caster",Vector2(18150,1580))
    _spawn_mountain_enemy("ash_hound",Vector2(29400,1580))
    _spawn_mountain_enemy("storm_shaman",Vector2(31000,1580))
    _spawn_tower_enemy("void_sentry",Vector2(38600,1580))
    _spawn_tower_enemy("arcane_eye",Vector2(40800,1450))

func _spawn_enemy(kind: String, at: Vector2) -> void:
    if not is_instance_valid(player):
        return
    var enemy: RealmEnemy = RealmEnemy.new().setup(kind,at,player)
    enemy.add_to_group("realm_enemies")
    add_child(enemy)
    enemy.request_flash.connect(_spawn_flash)
    enemy.damage_text_requested.connect(_spawn_damage_text)
    enemy.sfx_requested.connect(_play_sfx)

func _spawn_forest_enemy(kind: String, at: Vector2) -> void:
    if not is_instance_valid(player):
        return
    var enemy: ForestEnemy = ForestEnemy.new().setup(kind,at,player)
    enemy.add_to_group("forest_enemies")
    add_child(enemy)
    enemy.request_flash.connect(_spawn_flash)
    enemy.damage_text_requested.connect(_spawn_damage_text)
    enemy.sfx_requested.connect(_play_sfx)

func _spawn_keep_enemy(kind: String, at: Vector2) -> void:
    if not is_instance_valid(player):
        return
    var enemy: KeepEnemy = KeepEnemy.new().setup(kind,at,player)
    enemy.add_to_group("keep_enemies")
    add_child(enemy)
    enemy.request_flash.connect(_spawn_flash)
    enemy.damage_text_requested.connect(_spawn_damage_text)
    enemy.sfx_requested.connect(_play_sfx)

func _spawn_mountain_enemy(kind: String, at: Vector2) -> void:
    if not is_instance_valid(player):
        return
    var enemy: MountainEnemy = MountainEnemy.new().setup(kind,at,player)
    enemy.add_to_group("mountain_enemies")
    add_child(enemy)
    enemy.request_flash.connect(_spawn_flash)
    enemy.damage_text_requested.connect(_spawn_damage_text)
    enemy.sfx_requested.connect(_play_sfx)

func _spawn_tower_enemy(kind: String, at: Vector2) -> void:
    if not is_instance_valid(player):
        return
    var enemy: TowerEnemy = TowerEnemy.new().setup(kind,at,player)
    enemy.add_to_group("tower_enemies")
    add_child(enemy)
    enemy.request_flash.connect(_spawn_flash)
    enemy.damage_text_requested.connect(_spawn_damage_text)
    enemy.sfx_requested.connect(_play_sfx)

func _start_miniboss() -> void:
    miniboss_started = true
    audio.play_sfx("boss_sting",-3.0,1.0)
    hud.set_objective("Defeat the Grave Knight")
    hud.announce("THE BROKEN GATE  //  THE GRAVE KNIGHT WAKES",2.0)
    camera_trauma = maxf(camera_trauma,0.70)
    miniboss_left_gate = _platform(Vector2(MINIBOSS_LEFT_GATE_X,360),Vector2(42,500),Color("#171b20"))
    miniboss_right_gate = _platform(Vector2(MINIBOSS_RIGHT_GATE_X,360),Vector2(42,500),Color("#171b20"))
    miniboss = GraveKnight.new().setup(Vector2(MINIBOSS_SPAWN_X,560),player)
    add_child(miniboss)
    miniboss.request_flash.connect(_spawn_flash)
    miniboss.damage_text_requested.connect(_spawn_damage_text)
    miniboss.sfx_requested.connect(_play_sfx)
    miniboss.died.connect(_on_miniboss_died)
    hud.bind_miniboss(miniboss)

func _on_miniboss_died() -> void:
    miniboss_defeated = true
    hud.hide_miniboss()
    camera_trauma = 1.0
    if is_instance_valid(miniboss_left_gate):
        miniboss_left_gate.queue_free()
    if is_instance_valid(miniboss_right_gate):
        miniboss_right_gate.queue_free()
    checkpoint = Vector2(5580,560)
    hud.set_objective("Reach the Black Gate")
    hud.announce("THE GRAVE KNIGHT FALLS  //  THE ROAD OPENS",2.2)

func _clear_miniboss_for_retry() -> void:
    if is_instance_valid(miniboss):
        miniboss.queue_free()
    if is_instance_valid(miniboss_left_gate):
        miniboss_left_gate.queue_free()
    if is_instance_valid(miniboss_right_gate):
        miniboss_right_gate.queue_free()
    if is_instance_valid(hud):
        hud.hide_miniboss()
        hud.set_objective("Cross the Fallen Village")
    miniboss_started = false

func _start_boss() -> void:
    boss_started = true
    audio.play_sfx("boss_sting",-3.0,1.0)
    checkpoint = Vector2(6860,560)
    hud.set_objective("Defeat the Evil Wizard")
    hud.announce("THE BLACK GATE  //  THE WIZARD WAITS",2.2)
    camera_trauma = maxf(camera_trauma,0.75)

    # Full-height arena seals: impossible to simply wall-jump over during the fight.
    left_gate = _platform(Vector2(BOSS_LEFT_GATE_X,300),Vector2(BOSS_GATE_WIDTH,900),Color("#17141d"))
    right_gate = _platform(Vector2(BOSS_RIGHT_GATE_X,300),Vector2(BOSS_GATE_WIDTH,900),Color("#17141d"))

    boss = EvilWizardBoss.new().setup(
        Vector2(7550,560),
        player,
        BOSS_ARENA_LEFT,
        BOSS_ARENA_RIGHT
    )
    add_child(boss)
    boss.request_flash.connect(_spawn_flash)
    boss.damage_text_requested.connect(_spawn_damage_text)
    boss.sfx_requested.connect(_play_sfx)
    boss.projectile_requested.connect(_spawn_bolt)
    boss.summon_requested.connect(func(at: Vector2):
        _spawn_enemy("wisp" if randi()%2==0 else "crawler",at)
    )
    boss.phase_changed.connect(_on_boss_phase_changed)
    boss.died.connect(_on_boss_died)
    hud.bind_boss(boss)

    if is_instance_valid(camera):
        var tween: Tween = create_tween()
        tween.tween_property(camera,"zoom",Vector2(0.93,0.93),0.65).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)

func _start_forest_boss() -> void:
    forest_boss_started = true
    audio.play_sfx("boss_sting",-3.0,1.0)
    hud.set_objective("Defeat the Briar Hart")
    hud.announce("THE HEART GROVE  //  SOMETHING ANCIENT WAKES",2.2)
    camera_trauma = 0.85
    forest_left_gate = _platform(Vector2(FOREST_BOSS_LEFT_GATE_X,300),Vector2(52,900),Color("#17261c"))
    forest_right_gate = _platform(Vector2(FOREST_BOSS_RIGHT_GATE_X,300),Vector2(52,900),Color("#17261c"))
    forest_boss = BriarHart.new().setup(Vector2(13530,560),player,FOREST_BOSS_ARENA_LEFT,FOREST_BOSS_ARENA_RIGHT)
    add_child(forest_boss)
    forest_boss.request_flash.connect(_spawn_flash)
    forest_boss.damage_text_requested.connect(_spawn_damage_text)
    forest_boss.sfx_requested.connect(_play_sfx)
    forest_boss.projectile_requested.connect(_spawn_bolt)
    forest_boss.died.connect(_on_forest_boss_died)
    hud.bind_miniboss(forest_boss,"THE BRIAR HART  //  HEART OF THE WOODS")

func _on_forest_boss_died() -> void:
    forest_boss_defeated = true
    hud.hide_miniboss()
    camera_trauma = 1.0
    if is_instance_valid(forest_left_gate):
        forest_left_gate.queue_free()
    if is_instance_valid(forest_right_gate):
        forest_right_gate.queue_free()
    hud.set_objective("Enter the Sunken Keep")
    _save_progress()
    _play_story_cutscene("woods")

func _start_keep_boss() -> void:
    keep_boss_started = true
    audio.play_sfx("boss_sting",-3.0,1.0)
    hud.set_objective("Defeat the Drowned Castellan")
    hud.announce("THE FLOODED COURT  //  THE CASTELLAN RISES",2.2)
    camera_trauma = 0.90
    keep_left_gate = _platform(Vector2(KEEP_BOSS_LEFT_GATE_X,300),Vector2(52,900),Color("#17242a"))
    keep_right_gate = _platform(Vector2(KEEP_BOSS_RIGHT_GATE_X,300),Vector2(52,900),Color("#17242a"))
    keep_boss = DrownedCastellan.new().setup(
        Vector2(20440,560),
        player,
        KEEP_BOSS_ARENA_LEFT,
        KEEP_BOSS_ARENA_RIGHT
    )
    add_child(keep_boss)
    keep_boss.request_flash.connect(_spawn_flash)
    keep_boss.damage_text_requested.connect(_spawn_damage_text)
    keep_boss.sfx_requested.connect(_play_sfx)
    keep_boss.projectile_requested.connect(_spawn_tide_bolt)
    keep_boss.died.connect(_on_keep_boss_died)
    hud.bind_miniboss(keep_boss,"THE DROWNED CASTELLAN  //  WARDEN OF THE KEEP")

func _on_keep_boss_died() -> void:
    keep_boss_defeated = true
    hud.hide_miniboss()
    camera_trauma = 1.0
    if is_instance_valid(keep_left_gate):
        keep_left_gate.queue_free()
    if is_instance_valid(keep_right_gate):
        keep_right_gate.queue_free()
    hud.set_objective("Enter the Memory Labyrinth")
    _save_progress()
    _play_story_cutscene("keep")

func _start_mountain_boss() -> void:
    mountain_boss_started = true
    audio.play_sfx("boss_sting",-3.0,0.82)
    hud.set_objective("Defeat the Ash Colossus")
    hud.announce("THE ASHEN SUMMIT  //  THE MOUNTAIN STANDS UP",2.3)
    camera_trauma = 0.95
    mountain_left_gate = _platform(Vector2(MOUNTAIN_BOSS_LEFT_GATE_X,300),Vector2(52,900),Color("#211b20"))
    mountain_right_gate = _platform(Vector2(MOUNTAIN_BOSS_RIGHT_GATE_X,300),Vector2(52,900),Color("#211b20"))
    mountain_boss = AshColossus.new().setup(
        Vector2(35220,560),
        player,
        MOUNTAIN_BOSS_ARENA_LEFT,
        MOUNTAIN_BOSS_ARENA_RIGHT
    )
    add_child(mountain_boss)
    mountain_boss.request_flash.connect(_spawn_flash)
    mountain_boss.damage_text_requested.connect(_spawn_damage_text)
    mountain_boss.sfx_requested.connect(_play_sfx)
    mountain_boss.died.connect(_on_mountain_boss_died)
    hud.bind_miniboss(mountain_boss,"THE ASH COLOSSUS  //  HEART OF THE MOUNTAIN")

func _on_mountain_boss_died() -> void:
    mountain_boss_defeated = true
    hud.hide_miniboss()
    camera_trauma = 1.0
    if is_instance_valid(mountain_left_gate):
        mountain_left_gate.queue_free()
    if is_instance_valid(mountain_right_gate):
        mountain_right_gate.queue_free()
    hud.set_objective("Approach the Black Tower")
    _save_progress()
    _play_story_cutscene("mountain")

func _start_tower_boss() -> void:
    tower_boss_started = true
    audio.play_sfx("boss_sting",-3.0,0.76)
    hud.set_objective("Defeat the Obsidian Warden")
    hud.announce("THE UPPER SEAL  //  THE OBSIDIAN WARDEN DESCENDS",2.4)
    camera_trauma = 1.0
    tower_left_gate = _platform(Vector2(TOWER_BOSS_LEFT_GATE_X,300),Vector2(52,900),Color("#17121c"))
    tower_right_gate = _platform(Vector2(TOWER_BOSS_RIGHT_GATE_X,300),Vector2(52,900),Color("#17121c"))
    tower_boss = ObsidianWarden.new().setup(
        Vector2(45020,560),
        player,
        TOWER_BOSS_ARENA_LEFT,
        TOWER_BOSS_ARENA_RIGHT
    )
    add_child(tower_boss)
    tower_boss.request_flash.connect(_spawn_flash)
    tower_boss.damage_text_requested.connect(_spawn_damage_text)
    tower_boss.sfx_requested.connect(_play_sfx)
    tower_boss.died.connect(_on_tower_boss_died)
    hud.bind_miniboss(tower_boss,"THE OBSIDIAN WARDEN  //  KEEPER OF THE CROWN SEAL")

func _on_tower_boss_died() -> void:
    tower_boss_defeated = true
    hud.hide_miniboss()
    camera_trauma = 1.0
    if is_instance_valid(tower_left_gate):
        tower_left_gate.queue_free()
    if is_instance_valid(tower_right_gate):
        tower_right_gate.queue_free()
    hud.set_objective("Enter the Crown Chamber")
    _save_progress()
    _play_story_cutscene("tower")

func _start_true_wizard() -> void:
    final_boss_started = true
    audio.play_sfx("final_sting",-1.0,0.86)
    hud.set_objective("Defeat the True Evil Wizard")
    hud.announce("THE CROWN CHAMBER  //  THIS TIME, NO SHADOW",2.6)
    camera_trauma = 1.0

    final_left_gate = _platform(Vector2(FINAL_BOSS_LEFT_GATE_X,300),Vector2(54,900),Color("#120d16"))
    final_right_gate = _platform(Vector2(FINAL_BOSS_RIGHT_GATE_X,300),Vector2(54,900),Color("#120d16"))

    final_boss = TrueEvilWizard.new().setup(
        Vector2(50620,560),
        player,
        FINAL_BOSS_ARENA_LEFT,
        FINAL_BOSS_ARENA_RIGHT
    )
    add_child(final_boss)
    final_boss.projectile_requested.connect(_spawn_bolt)
    final_boss.summon_requested.connect(_on_final_summon_requested)
    final_boss.seal_requested.connect(_on_final_seal_requested)
    final_boss.phase_changed.connect(_on_final_phase_changed)
    final_boss.request_flash.connect(_spawn_flash)
    final_boss.damage_text_requested.connect(_spawn_damage_text)
    final_boss.sfx_requested.connect(_play_sfx)
    final_boss.died.connect(_on_true_wizard_died)
    hud.bind_true_wizard(final_boss)

func _on_final_summon_requested(at: Vector2, kind: String) -> void:
    if not is_instance_valid(player):
        return
    var enemy: TowerEnemy = TowerEnemy.new().setup(kind,at,player)
    enemy.add_to_group("final_summons")
    add_child(enemy)
    enemy.request_flash.connect(_spawn_flash)
    enemy.damage_text_requested.connect(_spawn_damage_text)
    enemy.sfx_requested.connect(_play_sfx)

func _on_final_seal_requested(count: int) -> void:
    for sigil: CrownSigil in crown_sigils:
        if is_instance_valid(sigil):
            sigil.queue_free()
    crown_sigils.clear()

    var positions: Array[Vector2] = [
        Vector2(49420,520),
        Vector2(50330,395),
        Vector2(51240,520)
    ]

    for i: int in range(mini(count,positions.size())):
        var sigil: CrownSigil = CrownSigil.new().setup(i,positions[i])
        crown_sigils.append(sigil)
        add_child(sigil)
        sigil.shattered.connect(_on_crown_sigil_shattered)
        sigil.request_flash.connect(_spawn_flash)
        sigil.damage_text_requested.connect(_spawn_damage_text)
        sigil.sfx_requested.connect(_play_sfx)

    audio.play_sfx("crown_seal",-2.0,0.90)
    hud.announce("THE CROWN SEAL  //  SHATTER THE THREE SIGILS",2.4)

func _on_crown_sigil_shattered(sigil: CrownSigil) -> void:
    if is_instance_valid(final_boss):
        final_boss.break_seal_piece()

    var remaining: int = 0
    for item: CrownSigil in crown_sigils:
        if is_instance_valid(item) and item != sigil and item.health>0.0:
            remaining += 1

    if remaining>0:
        hud.announce("CROWN SIGIL SHATTERED  //  %d REMAIN" % remaining,1.2)
    else:
        hud.announce("THE CROWN SEAL BREAKS",1.8)
        camera_trauma = 1.0

func _on_final_phase_changed(phase_value: int) -> void:
    camera_trauma = 1.0
    if phase_value == 2:
        hud.announce("PHASE II  //  THE CROWN SEAL",1.8)
    elif phase_value == 3:
        hud.announce("PHASE III  //  THE ROADS RETURN",1.8)
    elif phase_value >= 4:
        hud.announce("PHASE IV  //  MORTAL SPELL  //  HE BURNS WITH HIS OWN MAGIC",2.2)

func _on_true_wizard_died() -> void:
    final_boss_defeated = true
    hud.hide_boss()
    camera_trauma = 1.0

    if is_instance_valid(final_left_gate):
        final_left_gate.queue_free()
    if is_instance_valid(final_right_gate):
        final_right_gate.queue_free()

    for sigil: CrownSigil in crown_sigils:
        if is_instance_valid(sigil):
            sigil.queue_free()
    crown_sigils.clear()

    for enemy: Node in get_tree().get_nodes_in_group("final_summons"):
        if is_instance_valid(enemy):
            enemy.queue_free()

    _save_progress()
    _play_story_cutscene("ending")

func _spawn_tide_bolt(at: Vector2, direction: Vector2, speed: float, damage: float) -> void:
    var bolt: TideBolt = TideBolt.new().setup(at,direction,speed,damage)
    add_child(bolt)

func _spawn_bolt(at: Vector2, direction: Vector2, speed: float, damage: float) -> void:
    var bolt: DarkBolt = DarkBolt.new().setup(at,direction,speed,damage)
    add_child(bolt)

func _spawn_flash(at: Vector2, color: Color) -> void:
    var flash: HitFlash = HitFlash.new().setup(at,color)
    add_child(flash)
    if camera_shake_enabled:
        var strength: float = 0.18
        if color.r > 0.9 and color.g < 0.65:
            strength = 0.34
        elif color.b > 0.85:
            strength = 0.24
        camera_trauma = minf(1.0,camera_trauma+strength)

func _spawn_damage_text(at: Vector2, text: String, color: Color) -> void:
    var floating: FloatingCombatText = FloatingCombatText.new().setup(at,text,color)
    add_child(floating)

func _play_sfx(id: String, volume_db: float, pitch: float) -> void:
    if is_instance_valid(audio):
        audio.play_sfx(id,volume_db,pitch)

func _update_music_context(force: bool = false) -> void:
    if not is_instance_valid(audio) or not is_instance_valid(player) or cutscene_active:
        return

    var cue: String = "fallen_village_theme"

    if boss_started and not boss_defeated:
        cue = "evil_wizard_theme"
    elif miniboss_started and not miniboss_defeated:
        cue = "boss_battle_theme"
    elif forest_boss_started and not forest_boss_defeated:
        cue = "boss_battle_theme"
    elif keep_boss_started and not keep_boss_defeated:
        cue = "boss_battle_theme"
    elif mountain_boss_started and not mountain_boss_defeated:
        cue = "boss_battle_theme"
    elif tower_boss_started and not tower_boss_defeated:
        cue = "tower_warden_theme"
    elif final_boss_started and not final_boss_defeated:
        cue = "true_wizard_theme"
    else:
        var x: float = player.global_position.x
        if x < WOODS_LEFT:
            cue = "fallen_village_theme"
        elif x < KEEP_LEFT:
            cue = "whispering_woods_theme"
        elif x < LABYRINTH_LEFT:
            cue = "sunken_keep_theme"
        elif x < LABYRINTH_EXIT_X:
            cue = "memory_labyrinth_theme"
        elif x < BLACK_TOWER_LEFT:
            cue = "blighted_mountains_theme"
        elif x < CROWN_CHAMBER_LEFT:
            cue = "black_tower_theme"
        else:
            cue = "crown_chamber_theme"

    audio.set_music(cue,1.15,force)

func _enforce_player_world_bounds() -> void:
    if not is_instance_valid(player):
        return

    if player.global_position.x < WORLD_MIN_X:
        player.global_position.x = WORLD_MIN_X
        if player.velocity.x < 0.0:
            player.velocity.x = 0.0
        if is_instance_valid(hud):
            hud.announce("THE ROAD DOES NOT GO THAT WAY",0.75)

    elif player.global_position.x > WORLD_MAX_X:
        player.global_position.x = WORLD_MAX_X
        if player.velocity.x > 0.0:
            player.velocity.x = 0.0
        if is_instance_valid(hud):
            hud.announce("THE ROAD ENDS HERE",0.75)

func _update_camera(delta: float) -> void:
    if not is_instance_valid(camera):
        return
    camera_trauma = maxf(0.0,camera_trauma-delta*1.85)
    var target_offset: Vector2 = Vector2.ZERO
    if camera_shake_enabled and camera_trauma > 0.001:
        var magnitude: float = camera_trauma*camera_trauma*13.0
        target_offset = Vector2(rng.randf_range(-magnitude,magnitude),rng.randf_range(-magnitude,magnitude))
    camera.offset = camera.offset.lerp(target_offset,minf(1.0,delta*24.0))
    var look_ahead: float = 105.0*player.facing
    camera.position.x = lerpf(camera.position.x,look_ahead,minf(1.0,delta*2.8))

func _on_shard_collected(shard_id: String, _value: int) -> void:
    if shard_id not in collected_shard_ids:
        collected_shard_ids.append(shard_id)
    shard_count = mini(shard_total,collected_shard_ids.size())
    hud.set_shards(shard_count,shard_total)
    audio.play_sfx("checkpoint",-10.0,1.35+float(shard_count)*0.03)
    player.receive_arcane_shard(shard_count >= shard_total)
    if shard_count >= shard_total:
        hud.announce("ARCANE SET COMPLETE  //  POWER RESTORED",2.0)
    else:
        hud.announce("ARCANE SHARD RECOVERED  //  %d OF %d" % [shard_count,shard_total],1.15)

func _on_start_requested(hero_class: String) -> void:
    audio.play_sfx("ui_confirm",-8.0,1.0)
    SaveSystem.clear_save()
    selected_class = hero_class
    upgrades.clear()
    claimed_shrines.clear()
    collected_shard_ids.clear()
    shard_count = 0
    checkpoint_stage = 0
    checkpoint = Vector2(280,560)
    miniboss_defeated = false
    boss_defeated = false
    forest_boss_defeated = false
    keep_boss_defeated = false
    mountain_boss_defeated = false
    tower_boss_defeated = false
    final_boss_defeated = false
    crown_announced = false
    mirror_seal_solved = false
    tower_announced = false
    storm_gate_solved = false
    storm_vane_tutorial_shown = false
    mountain_announced = false
    labyrinth_solved = false
    labyrinth_progress = 0
    labyrinth_announced = false
    miniboss_started = false
    boss_started = false
    forest_boss_started = false
    keep_boss_started = false
    mountain_boss_started = false
    tower_boss_started = false
    final_boss_started = false
    player.configure_class(hero_class)
    player.reset_at(checkpoint)
    hud.set_shards(0,shard_total)
    hud.hide_title()
    get_tree().paused = false
    var class_title: String = "IRON AGAINST DARKNESS"
    if hero_class == "mage":
        class_title = "ARCANA AGAINST THE NIGHT"
    elif hero_class == "rogue":
        class_title = "A SHADOW HUNTS THE DARK"
    elif hero_class == "paladin":
        class_title = "FAITH WALKS INTO THE NIGHT"
    elif hero_class == "archer":
        class_title = "ONE ARROW THROUGH THE DARK"
    elif hero_class == "barbarian":
        class_title = "RAGE AGAINST THE DYING REALM"
    elif hero_class == "fighter":
        class_title = "DISCIPLINE AT THE EDGE OF DARKNESS"
    elif hero_class == "monk":
        class_title = "STILLNESS MOVES FASTER THAN FEAR"
    elif hero_class == "ranger":
        class_title = "THE HUNT FOLLOWS THE LAST ROAD"
    elif hero_class == "cleric":
        class_title = "GRACE WALKS WHERE THE BELLS FELL SILENT"
    elif hero_class == "bard":
        class_title = "A SONG THE DARK COULD NOT SILENCE"
    elif hero_class == "druid":
        class_title = "THE WILD REMEMBERS WHAT THE WIZARD BURNED"
    elif hero_class == "sorcerer":
        class_title = "POWER WITHOUT PERMISSION"
    elif hero_class == "warlock":
        class_title = "THE PACT HAS ONE LAST DEBT"
    elif hero_class == "wizard":
        class_title = "KNOWLEDGE AGAINST THE CROWN"
    _play_story_cutscene("prologue",class_title)


func _on_continue_requested() -> void:
    audio.play_sfx("ui_confirm",-8.0,0.96)
    var data: Dictionary = SaveSystem.load_game()
    if data.is_empty():
        hud.set_continue_available(false)
        return

    selected_class = str(data.get("hero_class","warrior"))
    checkpoint_stage = clampi(int(data.get("checkpoint_stage",0)),0,8)
    checkpoint = _checkpoint_for_stage(checkpoint_stage)

    upgrades.clear()
    for value: Variant in data.get("upgrades",[]):
        upgrades.append(str(value))

    claimed_shrines.clear()
    for value: Variant in data.get("claimed_shrines",[]):
        claimed_shrines.append(int(value))

    collected_shard_ids.clear()
    for value: Variant in data.get("collected_shards",[]):
        collected_shard_ids.append(str(value))
    shard_count = mini(shard_total,collected_shard_ids.size())

    miniboss_defeated = bool(data.get("miniboss_defeated",checkpoint_stage >= 2))
    boss_defeated = bool(data.get("shade_defeated",checkpoint_stage >= 3))
    forest_boss_defeated = bool(data.get("woods_boss_defeated",checkpoint_stage >= 4))
    keep_boss_defeated = bool(data.get("keep_boss_defeated",checkpoint_stage >= 5))
    labyrinth_solved = bool(data.get("labyrinth_solved",checkpoint_stage >= 5))
    storm_gate_solved = bool(data.get("storm_gate_solved",checkpoint_stage >= 6))
    mountain_boss_defeated = bool(data.get("mountain_boss_defeated",checkpoint_stage >= 7))
    mirror_seal_solved = bool(data.get("mirror_seal_solved",checkpoint_stage >= 7))
    tower_boss_defeated = bool(data.get("tower_boss_defeated",checkpoint_stage >= 8))
    final_boss_defeated = bool(data.get("final_boss_defeated",false))

    player.configure_class(selected_class)
    for upgrade_id: String in upgrades:
        player.apply_upgrade(upgrade_id)
    player.reset_at(checkpoint)

    if checkpoint_stage >= 1:
        shrine_village.activate()
    if checkpoint_stage >= 2:
        shrine_gate.activate()
    if checkpoint_stage >= 3:
        shrine_woods.activate()
    if checkpoint_stage >= 4:
        shrine_keep.activate()
    if checkpoint_stage >= 5:
        shrine_memory.activate()
    if checkpoint_stage >= 6:
        shrine_mountain.activate()
    if checkpoint_stage >= 7:
        shrine_tower.activate()
    if checkpoint_stage >= 8:
        shrine_crown.activate()

    if labyrinth_solved:
        _restore_labyrinth_solved()
    if storm_gate_solved:
        _restore_storm_gate()
    if mirror_seal_solved:
        _restore_mirror_seal()

    _remove_saved_shards()
    hud.set_shards(shard_count,shard_total)
    hud.hide_title()
    if final_boss_defeated:
        hud.set_objective("The realm breathes again")
    elif tower_boss_defeated:
        hud.set_objective("Reach the Shrine Beneath the Crown")
    elif mirror_seal_solved:
        hud.set_objective("Reach the Upper Seal")
    elif mountain_boss_defeated:
        hud.set_objective("Align the three Arcane Mirrors")
    elif storm_gate_solved:
        hud.set_objective("Reach the Ashen Summit")
    elif labyrinth_solved:
        hud.set_objective("Align the three Storm Vanes")
    elif keep_boss_defeated:
        hud.set_objective("Solve the Memory Labyrinth")
    elif forest_boss_defeated:
        hud.set_objective("Descend through the Sunken Keep")
    elif boss_defeated:
        hud.set_objective("Find the Heart of the Woods")
    else:
        hud.set_objective("Reach the Black Gate" if miniboss_defeated else "Cross the Fallen Village")
    get_tree().paused = false
    _update_music_context(true)
    hud.announce("THE ROAD REMEMBERS  //  JOURNEY RESTORED",2.0)

func _on_movement_lab_requested() -> void:
    get_tree().paused = false
    get_tree().change_scene_to_file("res://scenes/MovementLab.tscn")

func _checkpoint_for_stage(stage: int) -> Vector2:
    if stage >= 8:
        return Vector2(CROWN_CHECKPOINT_X,560)
    if stage == 7:
        return Vector2(TOWER_CHECKPOINT_X,560)
    if stage == 6:
        return Vector2(MOUNTAIN_CHECKPOINT_X,560)
    if stage == 5:
        return Vector2(LABYRINTH_CHECKPOINT_X,560)
    if stage == 4:
        return Vector2(KEEP_CHECKPOINT_X,560)
    if stage == 3:
        return Vector2(WOODS_CHECKPOINT_X,560)
    if stage == 2:
        return Vector2(5920,560)
    if stage == 1:
        return Vector2(3670,560)
    return Vector2(280,560)

func _save_progress() -> void:
    var data: Dictionary = {
        "hero_class": selected_class,
        "checkpoint_stage": checkpoint_stage,
        "upgrades": upgrades.duplicate(),
        "claimed_shrines": claimed_shrines.duplicate(),
        "collected_shards": collected_shard_ids.duplicate(),
        "miniboss_defeated": miniboss_defeated,
        "shade_defeated": boss_defeated,
        "woods_boss_defeated": forest_boss_defeated,
        "keep_boss_defeated": keep_boss_defeated,
        "labyrinth_solved": labyrinth_solved,
        "storm_gate_solved": storm_gate_solved,
        "mountain_boss_defeated": mountain_boss_defeated,
        "mirror_seal_solved": mirror_seal_solved,
        "tower_boss_defeated": tower_boss_defeated,
        "final_boss_defeated": final_boss_defeated
    }
    SaveSystem.save_game(data)
    hud.set_continue_available(true)

func _offer_shrine_blessing(stage: int) -> void:
    if stage in claimed_shrines:
        _save_progress()
        return
    pending_shrine_stage = stage
    hud.show_shrine_choices(stage,upgrades)
    get_tree().paused = true

func _on_shrine_upgrade_requested(upgrade_id: String) -> void:
    if pending_shrine_stage <= 0:
        return
    if upgrade_id in upgrades:
        return
    upgrades.append(upgrade_id)
    claimed_shrines.append(pending_shrine_stage)
    player.apply_upgrade(upgrade_id)
    hud.hide_shrine_choices()
    get_tree().paused = false
    audio.play_sfx("ui_confirm",-10.0,1.08)
    audio.play_sfx("checkpoint",-4.0,1.18)
    var blessing_name: String = upgrade_id.to_upper()
    hud.announce("SHRINE BLESSING  //  %s" % blessing_name,1.8)
    pending_shrine_stage = 0
    _save_progress()

func _remove_saved_shards() -> void:
    for node: Node in get_tree().get_nodes_in_group("arcane_shards"):
        if node is ArcaneShard:
            var shard: ArcaneShard = node as ArcaneShard
            if shard.shard_id in collected_shard_ids:
                shard.queue_free()

func _update_context_tracker() -> void:
    if not is_instance_valid(hud):
        return

    if labyrinth_solved and not storm_gate_solved:
        var aligned: int = 0
        for vane: StormVane in storm_vanes:
            if is_instance_valid(vane) and vane.is_correct():
                aligned += 1
        hud.set_puzzle_status(
            "STORM VANES",
            aligned,
            3,
            "APPROACH A VANE + F TO ROTATE   //   RISING SUN • SETTING SUN • SUMMIT"
        )
        return

    if mountain_boss_defeated and not mirror_seal_solved:
        var mirrors_aligned: int = 0
        for mirror: ArcaneMirror in arcane_mirrors:
            if is_instance_valid(mirror) and mirror.is_correct():
                mirrors_aligned += 1
        hud.set_puzzle_status(
            "ARCANE MIRRORS",
            mirrors_aligned,
            3,
            "APPROACH A MIRROR + F TO ROTATE"
        )
        return

    if final_boss_started and is_instance_valid(final_boss) and final_boss.seal_remaining > 0:
        hud.set_puzzle_status(
            "CROWN SIGILS",
            3-final_boss.seal_remaining,
            3,
            "DESTROY THE SIGILS TO BREAK THE WIZARD'S SEAL"
        )
        return

    hud.clear_puzzle_status()

func _update_interactions() -> void:
    if not is_instance_valid(hud) or cutscene_active:
        return

    if dialogue_active:
        hud.set_interaction_prompt("")
        if Input.is_action_just_pressed("interact"):
            _advance_dialogue()
        return

    if travel_cooldown<=0.0:
        var nearest_travel: WorldTravelNode = null
        var travel_distance: float = INF
        for travel: WorldTravelNode in travel_nodes:
            if is_instance_valid(travel) and travel.is_player_near():
                var distance: float = player.global_position.distance_to(travel.global_position)
                if distance<travel_distance:
                    nearest_travel=travel
                    travel_distance=distance
        if is_instance_valid(nearest_travel):
            hud.set_interaction_prompt(nearest_travel.prompt())
            if Input.is_action_just_pressed("interact"):
                _use_travel_node(nearest_travel)
            return

    for lever: WorldLever in world_levers:
        if is_instance_valid(lever) and not lever.activated and lever.is_player_near():
            hud.set_interaction_prompt("F  PULL LEVER  //  OPEN SHORTCUT")
            if Input.is_action_just_pressed("interact"):
                _activate_world_lever(lever)
            return

    if is_instance_valid(bellkeeper) and bellkeeper.is_player_near():
        hud.set_interaction_prompt("F  SPEAK WITH MARA")
        if Input.is_action_just_pressed("interact"):
            _begin_dialogue()
        return

    if keep_boss_defeated and not labyrinth_solved:
        var nearest: RunePedestal = null
        var nearest_distance: float = INF
        for pedestal: RunePedestal in labyrinth_runes:
            if not is_instance_valid(pedestal) or pedestal.activated:
                continue
            if pedestal.is_player_near():
                var distance: float = player.global_position.distance_to(pedestal.global_position)
                if distance < nearest_distance:
                    nearest = pedestal
                    nearest_distance = distance

        if is_instance_valid(nearest):
            hud.set_interaction_prompt("F  TOUCH %s RUNE" % nearest.display_name)
            if Input.is_action_just_pressed("interact"):
                _activate_labyrinth_rune(nearest)
            return

    if labyrinth_solved and not storm_gate_solved:
        var nearest_vane: StormVane = null
        var vane_distance: float = INF
        for vane: StormVane in storm_vanes:
            if not is_instance_valid(vane):
                continue
            if vane.is_player_near():
                var distance: float = player.global_position.distance_to(vane.global_position)
                if distance < vane_distance:
                    nearest_vane = vane
                    vane_distance = distance

        if is_instance_valid(nearest_vane):
            hud.set_interaction_prompt("F  ROTATE STORM VANE   •   CURRENT: %s" % nearest_vane.direction_name())
            if Input.is_action_just_pressed("interact"):
                _rotate_storm_vane(nearest_vane)
            return

    if mountain_boss_defeated and not mirror_seal_solved:
        var nearest_mirror: ArcaneMirror = null
        var mirror_distance: float = INF
        for mirror: ArcaneMirror in arcane_mirrors:
            if not is_instance_valid(mirror):
                continue
            if mirror.is_player_near():
                var distance: float = player.global_position.distance_to(mirror.global_position)
                if distance < mirror_distance:
                    nearest_mirror = mirror
                    mirror_distance = distance

        if is_instance_valid(nearest_mirror):
            hud.set_interaction_prompt("F  ROTATE %s MIRROR  //  %s" % [nearest_mirror.mirror_id.to_upper(),nearest_mirror.direction_name()])
            if Input.is_action_just_pressed("interact"):
                _rotate_arcane_mirror(nearest_mirror)
            return

    hud.set_interaction_prompt("")

func _begin_dialogue() -> void:
    if not is_instance_valid(bellkeeper):
        return
    dialogue_active = true
    dialogue_index = 0
    player.set_controls_locked(true)

    # Story conversations are safe narrative space. Freeze the gameplay tree so
    # enemies, bosses, projectiles, hazards, and moving platforms all stop.
    # This Game node keeps processing only so E can advance the dialogue.
    process_mode = Node.PROCESS_MODE_ALWAYS
    get_tree().paused = true

    audio.play_sfx("bell_chime",-13.0,0.92)
    hud.show_dialogue(bellkeeper.speaker_name,bellkeeper.get_line(dialogue_index))

func _advance_dialogue() -> void:
    if not dialogue_active or not is_instance_valid(bellkeeper):
        return
    dialogue_index += 1
    if dialogue_index >= bellkeeper.line_count():
        dialogue_active = false
        hud.hide_dialogue()

        get_tree().paused = false
        process_mode = Node.PROCESS_MODE_INHERIT
        player.set_controls_locked(false)
        player.invulnerable = maxf(player.invulnerable,0.45)
        return
    hud.show_dialogue(bellkeeper.speaker_name,bellkeeper.get_line(dialogue_index))


func _play_story_cutscene(id: String, class_title: String = "") -> void:
    if not is_instance_valid(cinema):
        return
    cutscene_active = true
    player.set_controls_locked(true)
    hud.gameplay_root.visible = false
    audio.set_music("cinematic_theme",0.55)
    get_tree().paused = true

    var hero_id: String = selected_class
    var beats: Array[Dictionary] = []

    if id == "prologue":
        beats = [
            {
                "chapter":"PROLOGUE  //  THE LAST ROAD",
                "speaker":"Mara's voice",
                "text":"The realm did not fall in one night. It vanished road by road, bell by bell, name by name.",
                "scene":"prologue",
                "hero":hero_id
            },
            {
                "chapter":"PROLOGUE  //  THE LAST ROAD",
                "speaker":"The Champion",
                "text":"%s. The road begins in the Fallen Village." % class_title,
                "scene":"prologue",
                "hero":hero_id
            },
            {
                "chapter":"PROLOGUE  //  THE LAST ROAD",
                "speaker":"The Evil Wizard",
                "text":"Come, then. Every hero eventually becomes another memory in my kingdom.",
                "scene":"black_gate",
                "hero":hero_id
            }
        ]
    elif id == "black_gate":
        beats = [
            {
                "chapter":"INTERLUDE I  //  A SHADOW DIES",
                "speaker":"The Champion",
                "text":"The body is gone. No blood. No bones. Only ash and a voice in the dark.",
                "scene":"black_gate",
                "hero":hero_id
            },
            {
                "chapter":"INTERLUDE I  //  A SHADOW DIES",
                "speaker":"The Evil Wizard",
                "text":"You killed a shadow wearing my face. Follow the moon if you want the man who cast it.",
                "scene":"woods",
                "hero":hero_id
            }
        ]
    elif id == "woods":
        beats = [
            {
                "chapter":"INTERLUDE II  //  THE WOODS EXHALE",
                "speaker":"Mara",
                "text":"The Briar Hart guarded a road older than the village. Beneath its roots, stone steps descend into drowned halls.",
                "scene":"woods",
                "hero":hero_id
            },
            {
                "chapter":"INTERLUDE II  //  THE WOODS EXHALE",
                "speaker":"Mara",
                "text":"Remember this: the Bell woke the village. The Moon watched the woods. The Crown drowned with the keep.",
                "scene":"labyrinth",
                "hero":hero_id
            }
        ]
    elif id == "keep":
        beats = [
            {
                "chapter":"INTERLUDE III  //  THE DROWNED CROWN",
                "speaker":"The Drowned Castellan",
                "text":"I guarded the Crown until the water climbed the throne. I guard it still, because memory does not know it is dead.",
                "scene":"keep",
                "hero":hero_id
            },
            {
                "chapter":"INTERLUDE III  //  THREE MEMORIES",
                "speaker":"Mara",
                "text":"Bell. Moon. Crown. The maze ahead was built to remember that order when people no longer could.",
                "scene":"labyrinth",
                "hero":hero_id
            },
            {
                "chapter":"INTERLUDE III  //  THE MOUNTAIN BEYOND",
                "speaker":"The Evil Wizard",
                "text":"Solve the little maze. The mountain will still break you.",
                "scene":"mountain",
                "hero":hero_id
            }
        ]
    elif id == "labyrinth":
        beats = [
            {
                "chapter":"INTERLUDE IV  //  THE MEMORY GATE",
                "speaker":"The Labyrinth",
                "text":"Bell. Moon. Crown. Three memories align, and a road forgotten by the world opens again.",
                "scene":"labyrinth",
                "hero":hero_id
            },
            {
                "chapter":"INTERLUDE IV  //  ASH ABOVE",
                "speaker":"The Champion",
                "text":"The Blighted Mountains are ahead. The Wizard is running out of places to hide.",
                "scene":"mountain",
                "hero":hero_id
            },
            {
                "chapter":"INTERLUDE IV  //  THE OLD WIND ROAD",
                "speaker":"Mara",
                "text":"Three storm vanes seal the summit road. Face the first toward the rising sun, the second toward the setting sun, and the last toward the summit.",
                "scene":"mountain",
                "hero":hero_id
            }
        ]
    elif id == "mountain":
        beats = [
            {
                "chapter":"INTERLUDE V  //  THE MOUNTAIN BREAKS",
                "speaker":"The Champion",
                "text":"The Colossus is down. Beyond the ash, the Black Tower is no longer a silhouette.",
                "scene":"mountain",
                "hero":hero_id
            },
            {
                "chapter":"INTERLUDE V  //  THE BLACK TOWER",
                "speaker":"The Evil Wizard",
                "text":"At last. No more shadows between us. Bring every blessing, every weapon, every scrap of courage you have left.",
                "scene":"black_gate",
                "hero":hero_id
            },
            {
                "chapter":"INTERLUDE V  //  THE MIRROR VAULT",
                "speaker":"Mara",
                "text":"The Tower's old mirrors were built to reject false paths. Lift the Moon mirror upward. Turn the Heart mirror into the Tower. Make the Road mirror look back the way you came.",
                "scene":"black_gate",
                "hero":hero_id
            }
        ]
    elif id == "tower":
        beats = [
            {
                "chapter":"INTERLUDE VI  //  THE LAST SEAL",
                "speaker":"The Obsidian Warden",
                "text":"I was not built to stop you. I was built to measure what would reach him.",
                "scene":"black_gate",
                "hero":hero_id
            },
            {
                "chapter":"INTERLUDE VI  //  THE CROWN CHAMBER",
                "speaker":"The Evil Wizard",
                "text":"You have crossed every grave I left behind. Come upstairs. This time, there will be no shadow wearing my face.",
                "scene":"black_gate",
                "hero":hero_id
            }
        ]
    elif id == "ending":
        beats = [
            {
                "chapter":"FINALE  //  THE CROWN FALLS",
                "speaker":"The Evil Wizard",
                "text":"I thought power and permanence were the same thing.",
                "scene":"black_gate",
                "hero":hero_id
            },
            {
                "chapter":"FINALE  //  THE LAST ROAD",
                "speaker":"The Champion",
                "text":"They were never the same thing. The road ends here.",
                "scene":"mountain",
                "hero":hero_id
            },
            {
                "chapter":"FINALE  //  THE BELLS RETURN",
                "speaker":"Mara",
                "text":"Listen. The village bell is ringing again. Not because the dead returned — because the living finally can.",
                "scene":"prologue",
                "hero":hero_id
            }
        ]
        if shard_count >= shard_total:
            beats.append({
                "chapter":"FINALE  //  FIVE SHARDS",
                "speaker":"Mara",
                "text":"The five Arcane Shards answer one another. Their light leaves the Crown Chamber and races back across every road you crossed.",
                "scene":"labyrinth",
                "hero":hero_id
            })
        beats.append({
            "chapter":"EPILOGUE  //  MORNING",
            "speaker":"The Last Road",
            "text":"The realm does not become what it was. It becomes alive again.",
            "scene":"prologue",
            "hero":hero_id
        })

    if beats.is_empty():
        cutscene_active = false
        player.set_controls_locked(false)
        hud.gameplay_root.visible = true
        get_tree().paused = false
        return

    cinema.play_sequence(id,beats)

func _on_cutscene_finished(id: String) -> void:
    cutscene_active = false
    player.set_controls_locked(false)
    hud.gameplay_root.visible = true
    get_tree().paused = false
    _update_music_context(true)

    if id == "prologue":
        hud.announce("THE FALLEN VILLAGE  //  THE LAST ROAD BEGINS",2.2)
    elif id == "black_gate":
        hud.set_objective("Enter the Whispering Woods")
        hud.announce("THE SHADOW FALLS  //  THE TRUE WIZARD REMAINS",2.2)
    elif id == "woods":
        hud.announce("THE DROWNED ROAD OPENS",1.8)
    elif id == "keep":
        hud.set_objective("Solve the Memory Labyrinth")
        hud.announce("BELL  //  MOON  //  CROWN",2.1)
    elif id == "labyrinth":
        hud.set_objective("Align the three Storm Vanes")
        hud.announce("THE MEMORY GATE OPENS  //  THE WIND ROAD WAITS",2.0)
    elif id == "mountain":
        hud.set_objective("Align the three Arcane Mirrors")
        hud.announce("THE BLACK TOWER  //  THE MIRROR VAULT WAITS",2.2)
    elif id == "tower":
        hud.set_objective("Reach the Shrine Beneath the Crown")
        hud.announce("THE LAST SEAL IS BROKEN  //  THE CROWN CHAMBER OPENS",2.2)
    elif id == "ending":
        hud.set_objective("The realm breathes again")
        audio.set_music("ending_theme",0.8,true)
        hud.show_victory(player.display_name)

func _activate_labyrinth_rune(pedestal: RunePedestal) -> void:
    if labyrinth_solved or not is_instance_valid(pedestal):
        return

    var order: Array[String] = ["bell","moon","crown"]
    var expected: String = order[labyrinth_progress]

    if pedestal.rune_id == expected:
        pedestal.set_activated(true)
        labyrinth_progress += 1
        audio.play_sfx("rune_correct",-6.0,0.92+float(labyrinth_progress)*0.08)
        hud.announce("%s REMEMBERED  //  %d OF 3" % [pedestal.display_name,labyrinth_progress],1.25)

        if labyrinth_progress >= order.size():
            labyrinth_solved = true
            if is_instance_valid(memory_gate):
                memory_gate.open_gate()
            audio.play_sfx("gate_open",-4.0,0.92)
            hud.set_objective("Pass through the Memory Gate")
            _save_progress()
            _play_story_cutscene("labyrinth")
    else:
        pedestal.reject()
        labyrinth_progress = 0
        for rune: RunePedestal in labyrinth_runes:
            if is_instance_valid(rune):
                rune.set_activated(false)
        audio.play_sfx("rune_wrong",-5.0,0.92)
        hud.announce("THE ORDER BREAKS  //  THE MAZE FORGETS",1.6)

func _restore_labyrinth_solved() -> void:
    labyrinth_progress = 3
    for pedestal: RunePedestal in labyrinth_runes:
        if is_instance_valid(pedestal):
            pedestal.set_activated(true)
    if is_instance_valid(memory_gate):
        memory_gate.open_gate()

func _rotate_storm_vane(vane: StormVane) -> void:
    if storm_gate_solved or not is_instance_valid(vane):
        return

    vane.rotate_clockwise()

    if vane.is_correct():
        audio.play_sfx("rune_correct",-7.0,1.12)
        hud.announce("%s VANE LOCKED  //  %s" % [vane.vane_id.to_upper(),vane.direction_name()],1.25)
    else:
        audio.play_sfx("wind_gust",-12.0,1.10)
        hud.announce("%s VANE TURNED  //  %s" % [vane.vane_id.to_upper(),vane.direction_name()],0.9)

    _update_context_tracker()

    var solved: bool = true
    for item: StormVane in storm_vanes:
        if not is_instance_valid(item) or not item.is_correct():
            solved = false
            break

    if solved:
        storm_gate_solved = true
        if is_instance_valid(storm_gate):
            storm_gate.open_gate()
        audio.play_sfx("gate_open",-3.0,0.78)
        hud.clear_puzzle_status()
        hud.set_objective("Cross the Storm Gate")
        hud.announce("ALL THREE VANES ALIGNED  //  THE WIND ROAD OPENS",2.3)
        _save_progress()

func _restore_storm_gate() -> void:
    storm_gate_solved = true
    for vane: StormVane in storm_vanes:
        if is_instance_valid(vane):
            vane.orientation = vane.target_orientation
            vane.queue_redraw()
    if is_instance_valid(storm_gate):
        storm_gate.open_gate()
    if is_instance_valid(hud):
        hud.clear_puzzle_status()

func _rotate_arcane_mirror(mirror: ArcaneMirror) -> void:
    if mirror_seal_solved or not is_instance_valid(mirror):
        return
    mirror.rotate_clockwise()
    audio.play_sfx("mirror_turn",-9.0,1.0)

    if mirror.is_correct():
        audio.play_sfx("mirror_lock",-8.0,1.08)
        hud.announce("%s MIRROR  //  %s  //  ALIGNED" % [mirror.mirror_id.to_upper(),mirror.direction_name()],1.15)
    else:
        hud.announce("%s MIRROR  //  %s" % [mirror.mirror_id.to_upper(),mirror.direction_name()],0.9)

    var solved: bool = true
    for item: ArcaneMirror in arcane_mirrors:
        if not is_instance_valid(item) or not item.is_correct():
            solved=false
            break

    if solved:
        mirror_seal_solved=true
        if is_instance_valid(mirror_seal_door):
            mirror_seal_door.open_gate()
        audio.play_sfx("mirror_lock",-3.0,0.92)
        hud.set_objective("Pass the Mirror Seal")
        hud.announce("THE THREE REFLECTIONS AGREE  //  THE SEAL OPENS",2.1)
        _save_progress()

func _restore_mirror_seal() -> void:
    mirror_seal_solved=true
    for mirror: ArcaneMirror in arcane_mirrors:
        if is_instance_valid(mirror):
            mirror.orientation=mirror.target_orientation
            mirror.queue_redraw()
    if is_instance_valid(mirror_seal_door):
        mirror_seal_door.open_gate()


func _on_pause_toggled() -> void:
    if cutscene_active or dialogue_active:
        return
    if hud.title_overlay.visible:
        return
    get_tree().paused = not get_tree().paused
    if get_tree().paused:
        hud.show_pause()
    else:
        hud.hide_pause()

func _on_restart_requested() -> void:
    get_tree().paused = false
    get_tree().reload_current_scene()

func _on_quit_requested() -> void:
    get_tree().paused = false
    get_tree().quit()

func _on_boss_phase_changed(new_phase: int) -> void:
    if new_phase > 1:
        camera_trauma = 1.0
        if new_phase == 2:
            hud.announce("THE WIZARD BREAKS HIS SEAL  //  PHASE II",1.8)
        elif new_phase >= 3:
            hud.announce("NO MORE MERCY  //  PHASE III",1.8)

func _on_player_died() -> void:
    if respawning:
        return
    respawning = true
    hud.announce("YOU FELL  //  RISE AGAIN",1.45)
    camera_trauma = 1.0
    await get_tree().create_timer(1.15).timeout
    if is_instance_valid(player):
        player.reset_at(checkpoint)
        if miniboss_started and not miniboss_defeated:
            _clear_miniboss_for_retry()
        if boss_started and not boss_defeated and is_instance_valid(boss):
            boss.reset_encounter()
            for enemy: Node in get_tree().get_nodes_in_group("realm_enemies"):
                if is_instance_valid(enemy) and enemy is Node2D:
                    var enemy_2d: Node2D = enemy as Node2D
                    if enemy_2d.global_position.x > 6700.0:
                        enemy.queue_free()
            hud.announce("THE BLACK GATE REMEMBERS",1.25)
        if forest_boss_started and not forest_boss_defeated:
            if is_instance_valid(forest_boss):
                forest_boss.queue_free()
            if is_instance_valid(forest_left_gate):
                forest_left_gate.queue_free()
            if is_instance_valid(forest_right_gate):
                forest_right_gate.queue_free()
            hud.hide_miniboss()
            forest_boss_started = false
            hud.announce("THE HEART GROVE REMEMBERS",1.25)
        if keep_boss_started and not keep_boss_defeated:
            if is_instance_valid(keep_boss):
                keep_boss.queue_free()
            if is_instance_valid(keep_left_gate):
                keep_left_gate.queue_free()
            if is_instance_valid(keep_right_gate):
                keep_right_gate.queue_free()
            hud.hide_miniboss()
            keep_boss_started = false
            hud.announce("THE FLOODED COURT REMEMBERS",1.25)
        if mountain_boss_started and not mountain_boss_defeated:
            if is_instance_valid(mountain_boss):
                mountain_boss.queue_free()
            if is_instance_valid(mountain_left_gate):
                mountain_left_gate.queue_free()
            if is_instance_valid(mountain_right_gate):
                mountain_right_gate.queue_free()
            hud.hide_miniboss()
            mountain_boss_started = false
            hud.announce("THE ASHEN SUMMIT REMEMBERS",1.25)
        if tower_boss_started and not tower_boss_defeated:
            if is_instance_valid(tower_boss):
                tower_boss.queue_free()
            if is_instance_valid(tower_left_gate):
                tower_left_gate.queue_free()
            if is_instance_valid(tower_right_gate):
                tower_right_gate.queue_free()
            hud.hide_miniboss()
            tower_boss_started=false
            hud.announce("THE UPPER SEAL REMEMBERS",1.25)
        if final_boss_started and not final_boss_defeated:
            if is_instance_valid(final_boss):
                final_boss.queue_free()
            if is_instance_valid(final_left_gate):
                final_left_gate.queue_free()
            if is_instance_valid(final_right_gate):
                final_right_gate.queue_free()
            for sigil: CrownSigil in crown_sigils:
                if is_instance_valid(sigil):
                    sigil.queue_free()
            crown_sigils.clear()
            for enemy: Node in get_tree().get_nodes_in_group("final_summons"):
                if is_instance_valid(enemy):
                    enemy.queue_free()
            hud.hide_boss()
            final_boss_started=false
            hud.announce("THE CROWN CHAMBER REMEMBERS",1.4)
    respawning = false

func _on_boss_died() -> void:
    boss_defeated = true
    _save_progress()
    hud.hide_boss()
    hud.set_objective("Enter the Whispering Woods")
    camera_trauma = 1.0
    if is_instance_valid(left_gate):
        left_gate.queue_free()
    if is_instance_valid(right_gate):
        right_gate.queue_free()
    if is_instance_valid(camera):
        var tween: Tween = create_tween()
        tween.tween_property(camera,"zoom",Vector2.ONE,1.0)
    _play_story_cutscene("black_gate")


func _install_gamepad_defaults() -> void:
    _add_joy_axis("move_left",0,-1.0)
    _add_joy_axis("move_right",0,1.0)
    _add_joy_button("jump",0)
    _add_joy_button("dash",1)
    _add_joy_button("attack",2)
    _add_joy_button("heavy_attack",3)
    _add_joy_button("ability_one",9)
    _add_joy_button("ability_two",10)
    _add_joy_button("ultimate",7)
    _add_joy_button("interact",4)
    _add_joy_button("pause",6)

func _add_joy_button(action: String, button_index: int) -> void:
    if not InputMap.has_action(action):
        return
    var event: InputEventJoypadButton = InputEventJoypadButton.new()
    event.button_index = button_index
    InputMap.action_add_event(action,event)

func _add_joy_axis(action: String, axis: int, value: float) -> void:
    if not InputMap.has_action(action):
        return
    var event: InputEventJoypadMotion = InputEventJoypadMotion.new()
    event.axis = axis
    event.axis_value = value
    InputMap.action_add_event(action,event)
