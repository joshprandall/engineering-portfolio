class_name Hero
extends CharacterBody2D

signal health_changed(current: float, maximum: float)
signal resource_changed(current: float, maximum: float)
signal identity_changed(display_name: String, resource_name: String, resource_color: Color, resource_help: String)
signal died
signal request_flash(at: Vector2, color: Color)
signal damage_text_requested(at: Vector2, text: String, color: Color)
signal sfx_requested(id: String, volume_db: float, pitch: float)
signal animation_state_changed(state: String)

const GRAVITY := 1900.0
const COYOTE_TIME := 0.13
const JUMP_BUFFER := 0.16
const DASH_DURATION := 0.15
const DASH_COOLDOWN := 0.52
const WALL_SLIDE_SPEED := 145.0
const WALL_JUMP_X := 440.0
const WALL_JUMP_Y := -630.0
const DASH_BUFFER := 0.11
const ATTACK_BUFFER := 0.13

var hero_class: String = "warrior"
var display_name: String = "WARRIOR"
var max_health: float = 160.0
var max_resource: float = 100.0
var health: float = 160.0
var resource: float = 0.0
var resource_name: String = "RAGE"
var resource_color: Color = Color("#d39a3d")
var resource_help: String = "Q LAST STAND WHEN FULL"
var move_speed: float = 340.0
var acceleration: float = 2850.0
var air_acceleration: float = 1900.0
var friction: float = 3200.0
var jump_speed: float = -700.0
var dash_speed: float = 870.0

var facing: float = 1.0
var coyote: float = 0.0
var jump_buffer: float = 0.0
var dash_time: float = 0.0
var dash_cooldown: float = 0.0
var attack_lock: float = 0.0
var invulnerable: float = 0.0
var combo_step: int = 0
var combo_timer: float = 0.0
var damage_multiplier: float = 1.0
var permanent_damage_multiplier: float = 1.0
var permanent_damage_reduction: float = 1.0
var resource_gain_multiplier: float = 1.0
var healing_multiplier: float = 1.0
var knockback_multiplier: float = 1.0
var controls_locked: bool = false
var ultimate_time: float = 0.0
var ability_one_cooldown: float = 0.0
var ability_two_cooldown: float = 0.0
var was_on_floor: bool = false
var squash: float = 0.0
var wall_jump_lock: float = 0.0
var gait_time: float = 0.0
var last_damage_time: float = 99.0
var dash_buffer: float = 0.0
var attack_buffer: float = 0.0
var max_air_jumps: int = 0
var air_jumps_remaining: int = 0
var animation_state: String = "idle"
var animation_time: float = 0.0
var action_visual_kind: String = ""
var action_visual_time: float = 0.0
var action_visual_total: float = 0.0
var afterimage_timer: float = 0.0
var guard_time: float = 0.0
var parry_time: float = 0.0
var sacred_armor_time: float = 0.0
var landing_visual_time: float = 0.0
var previous_grounded: bool = false
var berserk_time: float = 0.0
var counter_time: float = 0.0
var fighter_rush_time: float = 0.0
var inner_peace_time: float = 0.0
var starting_resource_floor: float = 0.0
var ranger_shot_count: int = 0
var aim_direction: Vector2 = Vector2.RIGHT
var mouse_light_down: bool = false
var mouse_heavy_down: bool = false
var crouching: bool = false
var slide_time: float = 0.0
var hero_collision: CollisionShape2D
var bard_rally_time: float = 0.0
var druid_avatar_time: float = 0.0
var sorcerer_overcharge_time: float = 0.0
var warlock_pact_time: float = 0.0
var wizard_focus_time: float = 0.0
var incoming_damage_multiplier: float = 1.0

func _ready() -> void:
    add_to_group("player_hero")
    collision_layer = 1
    collision_mask = 4
    floor_snap_length = 8.0
    floor_stop_on_slope = true
    hero_collision = CollisionShape2D.new()
    var capsule: CapsuleShape2D = CapsuleShape2D.new()
    capsule.radius = 18.0
    capsule.height = 58.0
    hero_collision.shape = capsule
    hero_collision.position = Vector2(0, -29)
    add_child(hero_collision)
    configure_class(hero_class)
    queue_redraw()

func configure_class(class_id: String) -> void:
    hero_class = class_id if class_id in ["warrior", "mage", "rogue", "paladin", "archer", "barbarian", "fighter", "monk", "ranger", "cleric", "bard", "druid", "sorcerer", "warlock", "wizard"] else "warrior"
    permanent_damage_multiplier = 1.0
    permanent_damage_reduction = 1.0
    resource_gain_multiplier = 1.0
    healing_multiplier = 1.0
    knockback_multiplier = 1.0
    starting_resource_floor = 0.0
    damage_multiplier = permanent_damage_multiplier
    controls_locked = false
    ultimate_time = 0.0
    combo_step = 0
    combo_timer = 0.0
    ability_one_cooldown = 0.0
    ability_two_cooldown = 0.0
    if hero_class == "mage":
        display_name = "MAGE"
        max_health = 112.0
        max_resource = 100.0
        resource_name = "MANA"
        resource_color = Color("#5ca9e8")
        resource_help = "L FROST NOVA   I FLAME WAVE   Q METEOR AT FULL MANA"
        move_speed = 350.0
        acceleration = 3000.0
        air_acceleration = 2150.0
        friction = 3300.0
        jump_speed = -710.0
        dash_speed = 940.0
        max_air_jumps = 0
        resource = max_resource
    elif hero_class == "rogue":
        display_name = "ROGUE"
        max_health = 104.0
        max_resource = 100.0
        resource_name = "SHADOW"
        resource_color = Color("#b77cff")
        resource_help = "L SMOKE STEP   I FAN OF KNIVES   Q SHADOW DANCE WHEN FULL"
        move_speed = 410.0
        acceleration = 3650.0
        air_acceleration = 2925.0
        friction = 3550.0
        jump_speed = -735.0
        dash_speed = 1060.0
        max_air_jumps = 1
        resource = 0.0
    elif hero_class == "paladin":
        display_name = "PALADIN"
        max_health = 178.0
        max_resource = 100.0
        resource_name = "FAITH"
        resource_color = Color("#f1d86d")
        resource_help = "L DIVINE GUARD   I SACRED NOVA   Q JUDGMENT WHEN FULL"
        move_speed = 322.0
        acceleration = 2700.0
        air_acceleration = 1750.0
        friction = 3300.0
        jump_speed = -680.0
        dash_speed = 790.0
        max_air_jumps = 0
        resource = 20.0
    elif hero_class == "archer":
        display_name = "ARCHER"
        max_health = 116.0
        max_resource = 100.0
        resource_name = "FOCUS"
        resource_color = Color("#72d6a0")
        resource_help = "L PIERCING ARROW   I ARROW RAIN   Q PERFECT VOLLEY WHEN FULL"
        move_speed = 376.0
        acceleration = 3320.0
        air_acceleration = 2440.0
        friction = 3400.0
        jump_speed = -720.0
        dash_speed = 930.0
        max_air_jumps = 0
        resource = 0.0
    elif hero_class == "barbarian":
        display_name = "BARBARIAN"
        max_health = 194.0
        max_resource = 100.0
        resource_name = "FURY"
        resource_color = Color("#e36f4e")
        resource_help = "L GROUND SLAM   I BERSERK   Q WORLDBREAKER WHEN FULL"
        move_speed = 332.0
        acceleration = 2920.0
        air_acceleration = 1980.0
        friction = 3100.0
        jump_speed = -715.0
        dash_speed = 900.0
        max_air_jumps = 0
        resource = 0.0
    elif hero_class == "fighter":
        display_name = "FIGHTER"
        max_health = 152.0
        max_resource = 100.0
        resource_name = "MOMENTUM"
        resource_color = Color("#e2b66f")
        resource_help = "L PARRY   I RIPOSTE   Q RELENTLESS ASSAULT WHEN FULL"
        move_speed = 362.0
        acceleration = 3380.0
        air_acceleration = 2280.0
        friction = 3500.0
        jump_speed = -705.0
        dash_speed = 965.0
        max_air_jumps = 0
        resource = 0.0
    elif hero_class == "monk":
        display_name = "MONK"
        max_health = 124.0
        max_resource = 100.0
        resource_name = "CHI"
        resource_color = Color("#7ed8c8")
        resource_help = "L FLURRY   I INNER PEACE   Q HUNDRED HANDS WHEN FULL"
        move_speed = 420.0
        acceleration = 3900.0
        air_acceleration = 3050.0
        friction = 3700.0
        jump_speed = -742.0
        dash_speed = 1120.0
        max_air_jumps = 0
        resource = 0.0
    elif hero_class == "ranger":
        display_name = "RANGER"
        max_health = 132.0
        max_resource = 100.0
        resource_name = "HUNT"
        resource_color = Color("#91c96d")
        resource_help = "L AIMED SHOT   I NATURE'S FAVOR   Q PREDATOR'S FOCUS WHEN FULL"
        move_speed = 386.0
        acceleration = 3450.0
        air_acceleration = 2560.0
        friction = 3460.0
        jump_speed = -724.0
        dash_speed = 980.0
        max_air_jumps = 0
        resource = 0.0
        ranger_shot_count = 0
    elif hero_class == "cleric":
        display_name = "CLERIC"
        max_health = 148.0
        max_resource = 100.0
        resource_name = "GRACE"
        resource_color = Color("#b8d8ef")
        resource_help = "L SMITE   I REJUVENATION   Q DIVINE INTERVENTION WHEN FULL"
        move_speed = 338.0
        acceleration = 2920.0
        air_acceleration = 2040.0
        friction = 3320.0
        jump_speed = -690.0
        dash_speed = 875.0
        max_air_jumps = 0
        resource = 12.0
    elif hero_class == "bard":
        display_name = "BARD"
        max_health = 118.0
        max_resource = 100.0
        resource_name = "TEMPO"
        resource_color = Color("#e88fc8")
        resource_help = "L DISCORDANT CHORD   I RALLYING CHORUS   Q FINALE WHEN FULL"
        move_speed = 374.0
        acceleration = 3400.0
        air_acceleration = 2480.0
        friction = 3440.0
        jump_speed = -718.0
        dash_speed = 990.0
        max_air_jumps = 0
        resource = 10.0
    elif hero_class == "druid":
        display_name = "DRUID"
        max_health = 136.0
        max_resource = 100.0
        resource_name = "NATURE"
        resource_color = Color("#75c77c")
        resource_help = "L ENTANGLE   I REGROWTH   Q AVATAR OF THE GROVE WHEN FULL"
        move_speed = 360.0
        acceleration = 3180.0
        air_acceleration = 2360.0
        friction = 3340.0
        jump_speed = -724.0
        dash_speed = 1010.0
        max_air_jumps = 0
        resource = 18.0
    elif hero_class == "sorcerer":
        display_name = "SORCERER"
        max_health = 102.0
        max_resource = 100.0
        resource_name = "SURGE"
        resource_color = Color("#ff8b6b")
        resource_help = "L LIGHTNING BURST   I OVERCHARGE   Q ARCANE CATACLYSM WHEN FULL"
        move_speed = 368.0
        acceleration = 3260.0
        air_acceleration = 2460.0
        friction = 3340.0
        jump_speed = -716.0
        dash_speed = 1040.0
        max_air_jumps = 0
        resource = 25.0
    elif hero_class == "warlock":
        display_name = "WARLOCK"
        max_health = 122.0
        max_resource = 100.0
        resource_name = "PACT"
        resource_color = Color("#a26bd8")
        resource_help = "L SOUL DRAIN   I CURSE   Q INFERNAL PACT WHEN FULL"
        move_speed = 346.0
        acceleration = 3040.0
        air_acceleration = 2260.0
        friction = 3260.0
        jump_speed = -704.0
        dash_speed = 970.0
        max_air_jumps = 0
        resource = 20.0
    elif hero_class == "wizard":
        display_name = "WIZARD"
        max_health = 100.0
        max_resource = 100.0
        resource_name = "ARCANA"
        resource_color = Color("#9d8cff")
        resource_help = "L MAGIC MISSILES   I TIME WARP   Q ARCANE SINGULARITY WHEN FULL"
        move_speed = 344.0
        acceleration = 2980.0
        air_acceleration = 2220.0
        friction = 3280.0
        jump_speed = -706.0
        dash_speed = 1080.0
        max_air_jumps = 0
        resource = max_resource
    else:
        display_name = "WARRIOR"
        max_health = 160.0
        max_resource = 100.0
        resource_name = "RAGE"
        resource_color = Color("#d39a3d")
        resource_help = "L SHIELD BASH   I WHIRLWIND   Q LAST STAND WHEN FULL"
        move_speed = 340.0
        acceleration = 2850.0
        air_acceleration = 1900.0
        friction = 3200.0
        jump_speed = -700.0
        dash_speed = 870.0
        max_air_jumps = 0
        resource = 0.0
    air_jumps_remaining = max_air_jumps
    health = max_health
    health_changed.emit(health, max_health)
    resource_changed.emit(resource, max_resource)
    identity_changed.emit(display_name, resource_name, resource_color, resource_help)
    queue_redraw()

func _physics_process(delta: float) -> void:
    was_on_floor = is_on_floor()
    gait_time += delta * (7.0 + absf(velocity.x) * 0.025)
    last_damage_time += delta
    coyote = COYOTE_TIME if is_on_floor() else maxf(0.0, coyote - delta)
    jump_buffer = maxf(0.0, jump_buffer - delta)
    dash_time = maxf(0.0, dash_time - delta)
    dash_cooldown = maxf(0.0, dash_cooldown - delta)
    attack_lock = maxf(0.0, attack_lock - delta)
    invulnerable = maxf(0.0, invulnerable - delta)
    combo_timer = maxf(0.0, combo_timer - delta)
    ability_one_cooldown = maxf(0.0, ability_one_cooldown - delta)
    ability_two_cooldown = maxf(0.0, ability_two_cooldown - delta)
    wall_jump_lock = maxf(0.0, wall_jump_lock - delta)
    dash_buffer = maxf(0.0,dash_buffer-delta)
    attack_buffer = maxf(0.0,attack_buffer-delta)
    action_visual_time = maxf(0.0,action_visual_time-delta)
    afterimage_timer = maxf(0.0,afterimage_timer-delta)
    guard_time = maxf(0.0,guard_time-delta)
    parry_time = maxf(0.0,parry_time-delta)
    sacred_armor_time = maxf(0.0,sacred_armor_time-delta)
    landing_visual_time = maxf(0.0,landing_visual_time-delta)
    berserk_time = maxf(0.0,berserk_time-delta)
    counter_time = maxf(0.0,counter_time-delta)
    fighter_rush_time = maxf(0.0,fighter_rush_time-delta)
    inner_peace_time = maxf(0.0,inner_peace_time-delta)
    bard_rally_time = maxf(0.0,bard_rally_time-delta)
    druid_avatar_time = maxf(0.0,druid_avatar_time-delta)
    sorcerer_overcharge_time = maxf(0.0,sorcerer_overcharge_time-delta)
    warlock_pact_time = maxf(0.0,warlock_pact_time-delta)
    wizard_focus_time = maxf(0.0,wizard_focus_time-delta)
    slide_time = maxf(0.0,slide_time-delta)
    _update_aim_direction()
    var mouse_light_now: bool = Input.is_mouse_button_pressed(MOUSE_BUTTON_LEFT)
    var mouse_heavy_now: bool = Input.is_mouse_button_pressed(MOUSE_BUTTON_RIGHT)
    if mouse_light_now and not mouse_light_down:
        attack_buffer = ATTACK_BUFFER
    mouse_light_down = mouse_light_now
    var mouse_heavy_pressed: bool = mouse_heavy_now and not mouse_heavy_down
    mouse_heavy_down = mouse_heavy_now
    if hero_class=="barbarian":
        damage_multiplier = (1.40 if berserk_time>0.0 else 1.0)*permanent_damage_multiplier
    elif hero_class=="ranger":
        damage_multiplier = (1.35 if ultimate_time>0.0 else 1.0)*permanent_damage_multiplier
    elif hero_class=="bard":
        damage_multiplier = (1.30 if bard_rally_time>0.0 else 1.0)*permanent_damage_multiplier
    elif hero_class=="druid":
        damage_multiplier = (1.35 if druid_avatar_time>0.0 else 1.0)*permanent_damage_multiplier
    elif hero_class=="sorcerer":
        damage_multiplier = (1.42 if sorcerer_overcharge_time>0.0 else 1.0)*permanent_damage_multiplier
    elif hero_class=="warlock":
        damage_multiplier = (1.38 if warlock_pact_time>0.0 else 1.0)*permanent_damage_multiplier
    elif hero_class=="wizard":
        damage_multiplier = (1.32 if wizard_focus_time>0.0 else 1.0)*permanent_damage_multiplier
    var grounded_now: bool = is_on_floor()
    if grounded_now and not previous_grounded:
        landing_visual_time = 0.18
        squash = maxf(squash,0.15)
    previous_grounded = grounded_now
    squash = move_toward(squash, 0.0, delta * 5.5)
    _update_animation_state(delta)

    if is_on_floor():
        air_jumps_remaining = max_air_jumps

    if hero_class == "mage" and resource < max_resource:
        var regen_rate: float = 17.0 if last_damage_time > 1.8 else 10.0
        resource = minf(max_resource, resource + regen_rate * delta)
        resource_changed.emit(resource, max_resource)
    elif hero_class == "wizard" and resource < max_resource:
        resource = minf(max_resource,resource+(14.0 if last_damage_time>1.5 else 8.0)*delta)
        resource_changed.emit(resource,max_resource)
    elif hero_class == "druid" and resource < max_resource and is_on_floor():
        resource = minf(max_resource,resource+4.0*delta)
        resource_changed.emit(resource,max_resource)
    elif hero_class == "bard" and resource < max_resource and absf(velocity.x)>80.0:
        resource = minf(max_resource,resource+3.0*delta)
        resource_changed.emit(resource,max_resource)

    if ultimate_time > 0.0:
        ultimate_time = maxf(0.0, ultimate_time - delta)
        if ultimate_time <= 0.0:
            damage_multiplier = permanent_damage_multiplier
            queue_redraw()

    if controls_locked:
        if not is_on_floor():
            velocity.y += GRAVITY * delta
        velocity.x = move_toward(velocity.x, 0.0, friction * delta)
        move_and_slide()
        queue_redraw()
        return

    var wants_crouch: bool = (Input.is_action_pressed("move_down") or Input.is_action_pressed("crouch")) and is_on_floor()
    if wants_crouch:
        _set_crouching(true)
    elif crouching and _can_stand():
        _set_crouching(false)

    if Input.is_action_just_pressed("jump") or Input.is_action_just_pressed("move_up"):
        if crouching and _can_stand():
            _set_crouching(false)
        jump_buffer = JUMP_BUFFER
    if Input.is_action_just_pressed("dash"):
        if crouching and is_on_floor():
            _begin_slide()
        else:
            dash_buffer = DASH_BUFFER
    if Input.is_action_just_pressed("attack"):
        attack_buffer = ATTACK_BUFFER

    if dash_time > 0.0 and (Input.is_action_just_pressed("jump") or Input.is_action_just_pressed("move_up")) and was_on_floor:
        dash_time = 0.0
        velocity.y = jump_speed
        velocity.x *= 0.72
        jump_buffer = 0.0
        coyote = 0.0
        sfx_requested.emit("jump", -8.0, 1.04)

    if dash_buffer > 0.0 and dash_cooldown <= 0.0 and attack_lock <= 0.08:
        dash_buffer = 0.0
        _begin_dash()

    if slide_time > 0.0:
        _set_crouching(true)
        velocity.x = facing*maxf(move_speed*1.45,620.0)
        if afterimage_timer <= 0.0:
            afterimage_timer = 0.07
            _spawn_afterimage()
        move_and_slide()
        queue_redraw()
        return

    if dash_time > 0.0:
        velocity.x = facing*dash_speed
        velocity.y = -165.0 if hero_class=="barbarian" else 0.0
        if afterimage_timer <= 0.0:
            afterimage_timer = 0.045
            _spawn_afterimage()
        move_and_slide()
        queue_redraw()
        return

    if not is_on_floor():
        var gravity_scale: float = 1.0
        if absf(velocity.y) < 105.0:
            gravity_scale = 0.76
        elif velocity.y > 0.0:
            gravity_scale = 1.10
        if is_on_wall_only() and velocity.y > WALL_SLIDE_SPEED:
            velocity.y = move_toward(velocity.y, WALL_SLIDE_SPEED, 2800.0 * delta)
        else:
            velocity.y += GRAVITY * gravity_scale * delta

    if jump_buffer > 0.0:
        if coyote > 0.0 and attack_lock <= 0.10:
            velocity.y = jump_speed
            jump_buffer = 0.0
            coyote = 0.0
            squash = -0.16
            sfx_requested.emit("jump", -8.0, 1.0 if hero_class == "warrior" else 1.12)
        elif is_on_wall_only() and wall_jump_lock <= 0.0:
            var wall_normal: Vector2 = get_wall_normal()
            velocity.x = wall_normal.x * WALL_JUMP_X
            velocity.y = WALL_JUMP_Y
            facing = signf(velocity.x)
            jump_buffer = 0.0
            wall_jump_lock = 0.16
            air_jumps_remaining = max_air_jumps
            sfx_requested.emit("jump", -7.0, 1.13)
            request_flash.emit(global_position + Vector2(-facing * 12.0, -30.0), Color("#b9dfff"))
        elif air_jumps_remaining > 0 and attack_lock <= 0.10:
            air_jumps_remaining -= 1
            velocity.y = jump_speed * 0.94
            velocity.x += facing * 42.0
            jump_buffer = 0.0
            squash = -0.12
            sfx_requested.emit("jump",-7.0,1.24)
            request_flash.emit(global_position + Vector2(0,-20),Color("#c18cff"))
            _spawn_afterimage()

    if (Input.is_action_just_released("jump") or Input.is_action_just_released("move_up")) and velocity.y < -250.0:
        velocity.y *= 0.50

    var axis: float = Input.get_axis("move_left", "move_right")
    var accel: float = acceleration if is_on_floor() else air_acceleration
    if absf(axis) > 0.05 and absf(velocity.x) > 35.0 and signf(axis) != signf(velocity.x):
        accel *= 1.22
    if wall_jump_lock > 0.0:
        axis *= 0.25
    if absf(axis) > 0.05:
        facing = signf(axis)
        var attack_factor: float = 1.0 if attack_lock <= 0.0 else 0.38
        var crouch_factor: float = 0.44 if crouching else 1.0
        velocity.x = move_toward(velocity.x, axis * move_speed * attack_factor * crouch_factor, accel * delta)
    else:
        var decel: float = friction if is_on_floor() else friction * 0.24
        velocity.x = move_toward(velocity.x, 0.0, decel * delta)

    if attack_buffer > 0.0 and attack_lock <= 0.0:
        attack_buffer = 0.0
        if hero_class == "mage":
            _mage_light_attack()
        elif hero_class == "rogue":
            _rogue_light_attack()
        elif hero_class == "paladin":
            _paladin_light_attack()
        elif hero_class == "archer":
            _archer_light_attack()
        elif hero_class == "barbarian":
            _barbarian_light_attack()
        elif hero_class == "fighter":
            _fighter_light_attack()
        elif hero_class == "monk":
            _monk_light_attack()
        elif hero_class == "ranger":
            _ranger_light_attack()
        elif hero_class == "cleric":
            _cleric_light_attack()
        elif hero_class == "bard":
            _bard_light_attack()
        elif hero_class == "druid":
            _druid_light_attack()
        elif hero_class == "sorcerer":
            _sorcerer_light_attack()
        elif hero_class == "warlock":
            _warlock_light_attack()
        elif hero_class == "wizard":
            _wizard_light_attack()
        else:
            _warrior_light_attack()
    elif (Input.is_action_just_pressed("heavy_attack") or mouse_heavy_pressed) and attack_lock <= 0.0:
        if hero_class == "mage":
            _mage_heavy_attack()
        elif hero_class == "rogue":
            _rogue_heavy_attack()
        elif hero_class == "paladin":
            _paladin_heavy_attack()
        elif hero_class == "archer":
            _archer_heavy_attack()
        elif hero_class == "barbarian":
            _barbarian_heavy_attack()
        elif hero_class == "fighter":
            _fighter_heavy_attack()
        elif hero_class == "monk":
            _monk_heavy_attack()
        elif hero_class == "ranger":
            _ranger_heavy_attack()
        elif hero_class == "cleric":
            _cleric_heavy_attack()
        elif hero_class == "bard":
            _bard_heavy_attack()
        elif hero_class == "druid":
            _druid_heavy_attack()
        elif hero_class == "sorcerer":
            _sorcerer_heavy_attack()
        elif hero_class == "warlock":
            _warlock_heavy_attack()
        elif hero_class == "wizard":
            _wizard_heavy_attack()
        else:
            _warrior_heavy_attack()
    elif Input.is_action_just_pressed("ability_one") and attack_lock <= 0.0 and ability_one_cooldown <= 0.0:
        if hero_class == "mage":
            _frost_nova()
        elif hero_class == "rogue":
            _smoke_step()
        elif hero_class == "paladin":
            _divine_guard()
        elif hero_class == "archer":
            _piercing_arrow()
        elif hero_class == "barbarian":
            _ground_slam()
        elif hero_class == "fighter":
            _fighter_parry()
        elif hero_class == "monk":
            _monk_flurry()
        elif hero_class == "ranger":
            _aimed_shot()
        elif hero_class == "cleric":
            _cleric_smite()
        elif hero_class == "bard":
            _discordant_chord()
        elif hero_class == "druid":
            _entangle()
        elif hero_class == "sorcerer":
            _lightning_burst()
        elif hero_class == "warlock":
            _soul_drain()
        elif hero_class == "wizard":
            _magic_missiles()
        else:
            _shield_bash()
    elif Input.is_action_just_pressed("ability_two") and attack_lock <= 0.0 and ability_two_cooldown <= 0.0:
        if hero_class == "mage":
            _flame_wave()
        elif hero_class == "rogue":
            _fan_of_knives()
        elif hero_class == "paladin":
            _sacred_nova()
        elif hero_class == "archer":
            _arrow_rain()
        elif hero_class == "barbarian":
            _berserk()
        elif hero_class == "fighter":
            _fighter_riposte()
        elif hero_class == "monk":
            _inner_peace()
        elif hero_class == "ranger":
            _natures_favor()
        elif hero_class == "cleric":
            _rejuvenation()
        elif hero_class == "bard":
            _rallying_chorus()
        elif hero_class == "druid":
            _regrowth()
        elif hero_class == "sorcerer":
            _overcharge()
        elif hero_class == "warlock":
            _curse()
        elif hero_class == "wizard":
            _time_warp()
        else:
            _whirlwind()
    elif Input.is_action_just_pressed("ultimate") and resource >= max_resource and ultimate_time <= 0.0:
        if hero_class == "mage":
            _meteor()
        elif hero_class == "rogue":
            _shadow_dance()
        elif hero_class == "paladin":
            _judgment()
        elif hero_class == "archer":
            _perfect_volley()
        elif hero_class == "barbarian":
            _worldbreaker()
        elif hero_class == "fighter":
            _relentless_assault()
        elif hero_class == "monk":
            _hundred_hands()
        elif hero_class == "ranger":
            _predators_focus()
        elif hero_class == "cleric":
            _divine_intervention()
        elif hero_class == "bard":
            _finale()
        elif hero_class == "druid":
            _avatar_of_the_grove()
        elif hero_class == "sorcerer":
            _arcane_cataclysm()
        elif hero_class == "warlock":
            _infernal_pact()
        elif hero_class == "wizard":
            _arcane_singularity()
        else:
            _last_stand()

    move_and_slide()
    if not was_on_floor and is_on_floor() and velocity.y >= 0.0:
        squash = 0.12
    queue_redraw()

func _update_aim_direction() -> void:
    var stick: Vector2 = Vector2.ZERO
    var pads: Array[int] = Input.get_connected_joypads()
    if not pads.is_empty():
        var device: int = pads[0]
        stick = Vector2(Input.get_joy_axis(device,2),Input.get_joy_axis(device,3))
    if stick.length() > 0.32:
        aim_direction = stick.normalized()
    else:
        var mouse_delta: Vector2 = get_global_mouse_position()-(global_position+Vector2(0,-34))
        if mouse_delta.length() > 20.0:
            aim_direction = mouse_delta.normalized()
    if absf(aim_direction.x) > 0.18 and (Input.is_mouse_button_pressed(MOUSE_BUTTON_LEFT) or Input.is_mouse_button_pressed(MOUSE_BUTTON_RIGHT) or stick.length()>0.32):
        facing = signf(aim_direction.x)

func _set_crouching(value: bool) -> void:
    if crouching == value or not is_instance_valid(hero_collision):
        return
    crouching = value
    var capsule: CapsuleShape2D = hero_collision.shape as CapsuleShape2D
    if not capsule:
        return
    if crouching:
        capsule.height = 40.0
        hero_collision.position = Vector2(0,-20)
    else:
        capsule.height = 58.0
        hero_collision.position = Vector2(0,-29)
    queue_redraw()

func _can_stand() -> bool:
    var query: PhysicsShapeQueryParameters2D = PhysicsShapeQueryParameters2D.new()
    var capsule: CapsuleShape2D = CapsuleShape2D.new()
    capsule.radius = 18.0
    capsule.height = 58.0
    query.shape = capsule
    query.transform = Transform2D(0.0,global_position+Vector2(0,-29))
    query.collision_mask = 4
    query.exclude = [get_rid()]
    return get_world_2d().direct_space_state.intersect_shape(query,4).is_empty()

func _begin_slide() -> void:
    if not is_on_floor() or slide_time>0.0:
        return
    slide_time = 0.34
    dash_cooldown = maxf(dash_cooldown,0.34)
    invulnerable = maxf(invulnerable,0.16)
    _set_crouching(true)
    _set_action_pose("slide",0.34)
    sfx_requested.emit("combat_roll",-10.0,1.18)

func _area_damage(radius: float, damage: float, stun: float, color: Color, knockback: float = 360.0) -> int:
    var query: PhysicsShapeQueryParameters2D = PhysicsShapeQueryParameters2D.new()
    var circle: CircleShape2D = CircleShape2D.new()
    circle.radius = radius
    query.shape = circle
    query.transform = Transform2D(0.0,global_position+Vector2(0,-28))
    query.collision_mask = 2
    query.exclude = [get_rid()]
    var hits: Array[Dictionary] = get_world_2d().direct_space_state.intersect_shape(query,32)
    var count: int = 0
    for result: Dictionary in hits:
        var target = result.get("collider")
        if target and target.has_method("take_damage"):
            count += 1
            var side: float = signf(target.global_position.x-global_position.x)
            if side == 0.0:
                side = facing
            target.take_damage(damage*damage_multiplier,knockback*side,global_position,stun)
            request_flash.emit(target.global_position+Vector2(0,-28),color)
    if count>0:
        sfx_requested.emit("hit",-5.0,1.0)
    return count

func _begin_dash() -> void:
    if hero_class == "mage":
        dash_time = 0.12
        dash_cooldown = 0.46
    elif hero_class == "rogue":
        dash_time = 0.14
        dash_cooldown = 0.38
    elif hero_class == "paladin":
        dash_time = 0.18
        dash_cooldown = 0.58
    elif hero_class == "archer":
        dash_time = 0.14
        dash_cooldown = 0.44
    elif hero_class == "barbarian":
        dash_time = 0.18
        dash_cooldown = 0.54
    elif hero_class == "fighter":
        dash_time = 0.20
        dash_cooldown = 0.43
    elif hero_class == "monk":
        dash_time = 0.13
        dash_cooldown = 0.32
    elif hero_class == "ranger":
        dash_time = 0.15
        dash_cooldown = 0.39
    elif hero_class == "cleric":
        dash_time = 0.17
        dash_cooldown = 0.52
    elif hero_class == "bard":
        dash_time = 0.16
        dash_cooldown = 0.40
    elif hero_class == "druid":
        dash_time = 0.18
        dash_cooldown = 0.44
    elif hero_class == "sorcerer":
        dash_time = 0.13
        dash_cooldown = 0.42
    elif hero_class == "warlock":
        dash_time = 0.14
        dash_cooldown = 0.46
    elif hero_class == "wizard":
        dash_time = 0.11
        dash_cooldown = 0.44
    else:
        dash_time = DASH_DURATION
        dash_cooldown = DASH_COOLDOWN
    var dash_bonus: float = 0.08
    if hero_class=="monk":
        dash_bonus=0.16
    elif hero_class=="fighter":
        dash_bonus=0.14
    elif hero_class=="rogue":
        dash_bonus=0.12
    elif hero_class=="cleric":
        dash_bonus=0.12
    elif hero_class=="ranger":
        dash_bonus=0.10
    elif hero_class in ["bard","druid","sorcerer","warlock","wizard"]:
        dash_bonus=0.11
    invulnerable = dash_time+dash_bonus
    velocity = Vector2(facing*dash_speed,-165.0 if hero_class=="barbarian" else 0.0)
    _set_action_pose("dash",dash_time)
    if hero_class == "mage":
        sfx_requested.emit("teleport", -5.0, 1.18)
        request_flash.emit(global_position + Vector2(-facing * 12.0, -30.0), Color("#73caff"))
    elif hero_class == "rogue":
        sfx_requested.emit("teleport",-7.0,1.34)
        request_flash.emit(global_position + Vector2(-facing*12.0,-28.0),Color("#bb77ff"))
    elif hero_class == "paladin":
        sfx_requested.emit("bash",-6.0,0.82)
        request_flash.emit(global_position + Vector2(-facing*12.0,-28.0),Color("#f3dc83"))
    elif hero_class == "archer":
        sfx_requested.emit("dash",-7.0,1.18)
        request_flash.emit(global_position + Vector2(-facing*12.0,-28.0),Color("#7be2ad"))
    elif hero_class == "barbarian":
        sfx_requested.emit("ground_slam",-10.0,0.78)
        request_flash.emit(global_position+Vector2(-facing*12.0,-22.0),Color("#df7858"))
    elif hero_class == "fighter":
        sfx_requested.emit("combat_roll",-8.0,1.0)
        request_flash.emit(global_position+Vector2(-facing*12.0,-24.0),Color("#e2b875"))
    elif hero_class == "monk":
        sfx_requested.emit("wind_step",-9.0,1.08)
        request_flash.emit(global_position+Vector2(-facing*12.0,-26.0),Color("#7fe0d0"))
        _spawn_afterimage()
    elif hero_class == "ranger":
        sfx_requested.emit("dash",-8.0,1.22)
        request_flash.emit(global_position+Vector2(-facing*12.0,-25.0),Color("#8fd16d"))
        _spawn_afterimage()
    elif hero_class == "cleric":
        sfx_requested.emit("rejuvenate",-12.0,1.18)
        request_flash.emit(global_position+Vector2(-facing*10.0,-27.0),Color("#b9ddf3"))
    elif hero_class == "bard":
        sfx_requested.emit("dash",-9.0,1.28)
        request_flash.emit(global_position+Vector2(-facing*10,-26),Color("#e88fc8"))
    elif hero_class == "druid":
        sfx_requested.emit("wind_step",-9.0,0.92)
        request_flash.emit(global_position+Vector2(-facing*10,-26),Color("#75c77c"))
    elif hero_class == "sorcerer":
        sfx_requested.emit("teleport",-8.0,1.34)
        request_flash.emit(global_position+Vector2(-facing*10,-28),Color("#ff8b6b"))
    elif hero_class == "warlock":
        sfx_requested.emit("phase_shift",-8.0,0.88)
        request_flash.emit(global_position+Vector2(-facing*10,-28),Color("#a26bd8"))
    elif hero_class == "wizard":
        sfx_requested.emit("teleport",-7.0,0.92)
        request_flash.emit(global_position+Vector2(-facing*10,-30),Color("#9d8cff"))
    else:
        sfx_requested.emit("dash", -5.0, 1.0)
        request_flash.emit(global_position + Vector2(-facing * 12.0, -28.0), Color("#a9ddff"))

func _warrior_light_attack() -> void:
    combo_step = (combo_step + 1) if combo_timer > 0.0 else 1
    if combo_step > 3:
        combo_step = 1
    combo_timer = 0.42
    _set_action_pose("warrior_light_%d" % combo_step,attack_lock)
    attack_lock = [0.15, 0.17, 0.25][combo_step - 1]
    var damages: Array[float] = [18.0, 22.0, 34.0]
    var reaches: Array[float] = [62.0, 68.0, 78.0]
    sfx_requested.emit("slash", -7.0, 0.94 + combo_step * 0.06)
    _strike(damages[combo_step - 1] * damage_multiplier, reaches[combo_step - 1], 44.0, 260.0 + combo_step * 45.0)

func _warrior_heavy_attack() -> void:
    attack_lock = 0.44
    combo_timer = 0.0
    _set_action_pose("warrior_heavy",0.44)
    velocity.x += facing * 85.0
    sfx_requested.emit("heavy", -5.0, 0.92)
    await get_tree().create_timer(0.13).timeout
    if not is_inside_tree():
        return
    _strike(50.0 * damage_multiplier, 92.0, 56.0, 620.0)

func _shield_bash() -> void:
    ability_one_cooldown = 2.6
    attack_lock = 0.28
    _set_action_pose("warrior_bash",0.28)
    velocity.x = facing * 455.0
    sfx_requested.emit("bash", -5.0, 0.94)
    _strike(30.0 * damage_multiplier, 84.0, 50.0, 840.0, 0.58)

func _whirlwind() -> void:
    ability_two_cooldown = 4.6
    attack_lock = 0.48
    _set_action_pose("warrior_spin",0.48)
    sfx_requested.emit("whirlwind", -5.0, 1.0)
    var query: PhysicsShapeQueryParameters2D = PhysicsShapeQueryParameters2D.new()
    var circle: CircleShape2D = CircleShape2D.new()
    circle.radius = 108.0
    query.shape = circle
    query.transform = Transform2D(0.0, global_position + Vector2(0,-24))
    query.collision_mask = 2
    query.exclude = [get_rid()]
    var hits: Array[Dictionary] = get_world_2d().direct_space_state.intersect_shape(query, 24)
    for result in hits:
        var target = result.get("collider")
        if target and target.has_method("take_damage"):
            target.take_damage(38.0 * damage_multiplier, 520.0 * facing, global_position, 0.16)
            _gain_resource(10.0)
    request_flash.emit(global_position + Vector2(0,-24), Color("#ffb36b"))

func _last_stand() -> void:
    resource = 0.0
    resource_changed.emit(resource, max_resource)
    ultimate_time = 6.0
    damage_multiplier = 1.65 * permanent_damage_multiplier
    health = minf(max_health, health + 35.0)
    health_changed.emit(health, max_health)
    invulnerable = 0.45
    sfx_requested.emit("ultimate", -2.0, 1.0)
    request_flash.emit(global_position + Vector2(0,-24), Color("#ffd66b"))
    damage_text_requested.emit(global_position + Vector2(0,-92), "LAST STAND", Color("#ffd66b"))
    queue_redraw()

func _mage_light_attack() -> void:
    attack_lock = 0.14
    _set_action_pose("mage_cast",0.14)
    sfx_requested.emit("wizard_cast", -10.0, 1.28)
    _spawn_bolt(19.0 * damage_multiplier, 690.0, 0.0, Color("#79cfff"), 0.0)

func _mage_heavy_attack() -> void:
    if not _spend_resource(12.0):
        _mage_light_attack()
        return
    attack_lock = 0.38
    _set_action_pose("mage_charge",0.38)
    sfx_requested.emit("wizard_cast", -6.0, 0.82)
    await get_tree().create_timer(0.12).timeout
    if not is_inside_tree():
        return
    _spawn_bolt(42.0 * damage_multiplier, 560.0, 0.0, Color("#b487ff"), 0.18, 1.45)

func _frost_nova() -> void:
    if not _spend_resource(30.0):
        damage_text_requested.emit(global_position + Vector2(0,-86), "LOW MANA", Color("#8fd7ff"))
        return
    ability_one_cooldown = 2.8
    attack_lock = 0.34
    _set_action_pose("mage_nova",0.34)
    sfx_requested.emit("whirlwind", -8.0, 1.35)
    var query: PhysicsShapeQueryParameters2D = PhysicsShapeQueryParameters2D.new()
    var circle: CircleShape2D = CircleShape2D.new()
    circle.radius = 126.0
    query.shape = circle
    query.transform = Transform2D(0.0, global_position + Vector2(0,-24))
    query.collision_mask = 2
    query.exclude = [get_rid()]
    var hits: Array[Dictionary] = get_world_2d().direct_space_state.intersect_shape(query, 24)
    for result in hits:
        var target = result.get("collider")
        if target and target.has_method("take_damage"):
            target.take_damage(24.0 * damage_multiplier, 250.0 * signf(target.global_position.x - global_position.x), global_position, 1.15)
    request_flash.emit(global_position + Vector2(0,-24), Color("#8ee9ff"))
    _spawn_spell_burst(global_position + Vector2(0,-24), 126.0, Color("#8ee9ff"))

func _flame_wave() -> void:
    if not _spend_resource(34.0):
        damage_text_requested.emit(global_position + Vector2(0,-86), "LOW MANA", Color("#8fd7ff"))
        return
    ability_two_cooldown = 3.8
    attack_lock = 0.36
    _set_action_pose("mage_wave",0.36)
    sfx_requested.emit("ultimate", -9.0, 1.22)
    _spawn_bolt(26.0 * damage_multiplier, 610.0, -0.15, Color("#ff8c58"), 0.08, 1.18)
    _spawn_bolt(30.0 * damage_multiplier, 660.0, 0.0, Color("#ffac62"), 0.10, 1.28)
    _spawn_bolt(26.0 * damage_multiplier, 610.0, 0.15, Color("#ff8c58"), 0.08, 1.18)

func _meteor() -> void:
    resource = 0.0
    resource_changed.emit(resource, max_resource)
    attack_lock = 0.78
    invulnerable = 0.30
    _set_action_pose("mage_meteor",0.78)
    sfx_requested.emit("boss_phase", -2.0, 0.78)
    var center: Vector2 = global_position + Vector2(facing * 250.0, -24.0)
    request_flash.emit(center, Color("#ff6d52"))
    damage_text_requested.emit(global_position + Vector2(0,-96), "METEOR", Color("#ffc06e"))
    await get_tree().create_timer(0.34).timeout
    if not is_inside_tree():
        return
    _spawn_spell_burst(center, 190.0, Color("#ff6d52"))
    var query: PhysicsShapeQueryParameters2D = PhysicsShapeQueryParameters2D.new()
    var circle: CircleShape2D = CircleShape2D.new()
    circle.radius = 190.0
    query.shape = circle
    query.transform = Transform2D(0.0, center)
    query.collision_mask = 2
    var hits: Array[Dictionary] = get_world_2d().direct_space_state.intersect_shape(query, 32)
    for result in hits:
        var target = result.get("collider")
        if target and target.has_method("take_damage"):
            target.take_damage(82.0 * damage_multiplier, 720.0 * signf(target.global_position.x - center.x), center, 1.0)
    sfx_requested.emit("ultimate", -1.0, 0.72)








func _bard_light_attack() -> void:
    combo_step = (combo_step+1) if combo_timer>0.0 else 1
    if combo_step>3:
        combo_step=1
    combo_timer=0.46
    attack_lock=[0.14,0.16,0.23][combo_step-1]
    _set_action_pose("bard_rapier_%d" % combo_step,attack_lock)
    sfx_requested.emit("slash",-9.0,1.15+float(combo_step)*0.04)
    _strike([16.0,19.0,27.0][combo_step-1]*damage_multiplier,66.0+float(combo_step)*5.0,42.0,260.0)

func _bard_heavy_attack() -> void:
    attack_lock=0.27
    _set_action_pose("bard_note",0.27)
    sfx_requested.emit("bell_chime",-12.0,1.45)
    _spawn_bolt(28.0*damage_multiplier,760.0,0.0,Color("#ef9bd0"),0.16,0.82)

func _discordant_chord() -> void:
    if not _spend_resource(24.0):
        damage_text_requested.emit(global_position+Vector2(0,-88),"LOW TEMPO",Color("#ef9bd0"))
        return
    ability_one_cooldown=2.7
    attack_lock=0.30
    _set_action_pose("bard_chord",0.30)
    sfx_requested.emit("bell_chime",-5.0,0.72)
    _area_damage(128.0,34.0,0.62,Color("#ef9bd0"),420.0)
    _spawn_spell_burst(global_position+Vector2(0,-28),128.0,Color("#ef9bd0"))

func _rallying_chorus() -> void:
    if not _spend_resource(32.0):
        damage_text_requested.emit(global_position+Vector2(0,-88),"LOW TEMPO",Color("#ef9bd0"))
        return
    ability_two_cooldown=5.2
    bard_rally_time=6.0
    heal(26.0)
    _set_action_pose("bard_chorus",0.42)
    sfx_requested.emit("ultimate",-9.0,1.36)
    damage_text_requested.emit(global_position+Vector2(0,-92),"RALLYING CHORUS",Color("#ffd0e8"))

func _finale() -> void:
    resource=0.0
    resource_changed.emit(resource,max_resource)
    attack_lock=0.72
    invulnerable=0.45
    _set_action_pose("bard_finale",0.72)
    sfx_requested.emit("ultimate",-2.0,1.22)
    _area_damage(210.0,82.0,1.05,Color("#ffb6df"),760.0)
    heal(34.0)
    damage_text_requested.emit(global_position+Vector2(0,-100),"FINALE",Color("#ffcae7"))

func _druid_light_attack() -> void:
    attack_lock=0.18
    _set_action_pose("druid_vine",0.18)
    sfx_requested.emit("slash",-10.0,0.82)
    _strike(21.0*damage_multiplier,82.0,48.0,300.0,0.08)

func _druid_heavy_attack() -> void:
    if not _spend_resource(10.0):
        _druid_light_attack()
        return
    attack_lock=0.26
    _set_action_pose("druid_thorn",0.26)
    _spawn_bolt(35.0*damage_multiplier,720.0,0.0,Color("#7fd18a"),0.18,0.92,1)
    sfx_requested.emit("bow_shot",-10.0,0.72)

func _entangle() -> void:
    if not _spend_resource(28.0):
        damage_text_requested.emit(global_position+Vector2(0,-88),"LOW NATURE",Color("#8ee69a"))
        return
    ability_one_cooldown=3.1
    attack_lock=0.34
    _set_action_pose("druid_entangle",0.34)
    _area_damage(145.0,28.0,1.35,Color("#79d282"),180.0)
    _spawn_spell_burst(global_position+Vector2(0,-24),145.0,Color("#79d282"))
    sfx_requested.emit("wind_step",-9.0,0.68)

func _regrowth() -> void:
    if not _spend_resource(34.0):
        damage_text_requested.emit(global_position+Vector2(0,-88),"LOW NATURE",Color("#8ee69a"))
        return
    ability_two_cooldown=5.0
    attack_lock=0.32
    heal(48.0)
    invulnerable=maxf(invulnerable,0.28)
    _set_action_pose("druid_regrowth",0.32)
    sfx_requested.emit("rejuvenate",-7.0,0.88)

func _avatar_of_the_grove() -> void:
    resource=0.0
    resource_changed.emit(resource,max_resource)
    druid_avatar_time=7.0
    ultimate_time=7.0
    health=minf(max_health,health+30.0)
    health_changed.emit(health,max_health)
    _set_action_pose("druid_avatar",0.55)
    sfx_requested.emit("ultimate",-3.0,0.82)
    damage_text_requested.emit(global_position+Vector2(0,-100),"AVATAR OF THE GROVE",Color("#a9f2a5"))

func _sorcerer_light_attack() -> void:
    attack_lock=0.13
    _set_action_pose("sorcerer_bolt",0.13)
    _spawn_bolt(22.0*damage_multiplier,900.0,0.0,Color("#ff9b78"),0.04,0.78)
    sfx_requested.emit("wizard_cast",-10.0,1.42)

func _sorcerer_heavy_attack() -> void:
    if not _spend_resource(14.0):
        _sorcerer_light_attack()
        return
    attack_lock=0.30
    _set_action_pose("sorcerer_chain",0.30)
    for offset: float in [-0.12,0.0,0.12]:
        _spawn_bolt(25.0*damage_multiplier,820.0,offset,Color("#ffb07f"),0.10,0.82)
    sfx_requested.emit("true_cast",-8.0,1.22)

func _lightning_burst() -> void:
    if not _spend_resource(26.0):
        damage_text_requested.emit(global_position+Vector2(0,-88),"LOW SURGE",Color("#ffad8f"))
        return
    ability_one_cooldown=2.6
    attack_lock=0.28
    _set_action_pose("sorcerer_burst",0.28)
    _area_damage(118.0,40.0,0.38,Color("#ffd07f"),520.0)
    sfx_requested.emit("true_cast",-6.0,1.42)

func _overcharge() -> void:
    if not _spend_resource(30.0):
        damage_text_requested.emit(global_position+Vector2(0,-88),"LOW SURGE",Color("#ffad8f"))
        return
    ability_two_cooldown=5.0
    sorcerer_overcharge_time=5.5
    invulnerable=maxf(invulnerable,0.20)
    _set_action_pose("sorcerer_overcharge",0.35)
    sfx_requested.emit("phase_shift",-7.0,1.35)
    damage_text_requested.emit(global_position+Vector2(0,-94),"OVERCHARGE",Color("#ffc29f"))

func _arcane_cataclysm() -> void:
    resource=0.0
    resource_changed.emit(resource,max_resource)
    attack_lock=0.75
    invulnerable=0.48
    _set_action_pose("sorcerer_cataclysm",0.75)
    _area_damage(225.0,94.0,0.82,Color("#ff936f"),820.0)
    sfx_requested.emit("mortal_spell",-2.0,1.20)
    damage_text_requested.emit(global_position+Vector2(0,-100),"ARCANE CATACLYSM",Color("#ffb392"))

func _warlock_light_attack() -> void:
    attack_lock=0.15
    _set_action_pose("warlock_bolt",0.15)
    _spawn_bolt(23.0*damage_multiplier,790.0,0.0,Color("#aa73de"),0.08,0.82)
    sfx_requested.emit("void_pulse",-10.0,1.18)

func _warlock_heavy_attack() -> void:
    if not _spend_resource(12.0):
        _warlock_light_attack()
        return
    attack_lock=0.34
    _set_action_pose("warlock_lance",0.34)
    _spawn_bolt(45.0*damage_multiplier,680.0,0.0,Color("#cf83ee"),0.28,1.12,1)
    sfx_requested.emit("true_cast",-9.0,0.72)

func _soul_drain() -> void:
    if not _spend_resource(24.0):
        damage_text_requested.emit(global_position+Vector2(0,-88),"LOW PACT",Color("#c394ef"))
        return
    ability_one_cooldown=3.0
    attack_lock=0.38
    _set_action_pose("warlock_drain",0.38)
    var hits: int = _area_damage(132.0,31.0,0.32,Color("#b778df"),220.0)
    if hits>0: heal(12.0+float(hits)*7.0)
    sfx_requested.emit("void_pulse",-6.0,0.72)

func _curse() -> void:
    if not _spend_resource(30.0):
        damage_text_requested.emit(global_position+Vector2(0,-88),"LOW PACT",Color("#c394ef"))
        return
    ability_two_cooldown=4.6
    attack_lock=0.34
    _set_action_pose("warlock_curse",0.34)
    _area_damage(165.0,18.0,1.55,Color("#d287f0"),120.0)
    sfx_requested.emit("crown_seal",-9.0,0.78)

func _infernal_pact() -> void:
    resource=0.0
    resource_changed.emit(resource,max_resource)
    health=maxf(1.0,health-max_health*0.12)
    health_changed.emit(health,max_health)
    warlock_pact_time=7.0
    ultimate_time=7.0
    invulnerable=0.35
    _set_action_pose("warlock_pact",0.52)
    sfx_requested.emit("mortal_spell",-3.0,0.76)
    damage_text_requested.emit(global_position+Vector2(0,-100),"INFERNAL PACT",Color("#df9bff"))

func _wizard_light_attack() -> void:
    attack_lock=0.13
    _set_action_pose("wizard_missile",0.13)
    _spawn_bolt(20.0*damage_multiplier,860.0,0.0,Color("#a99bff"),0.05,0.74)
    sfx_requested.emit("wizard_cast",-11.0,1.18)

func _wizard_heavy_attack() -> void:
    if not _spend_resource(13.0):
        _wizard_light_attack()
        return
    attack_lock=0.34
    _set_action_pose("wizard_lance",0.34)
    _spawn_bolt(46.0*damage_multiplier,700.0,0.0,Color("#c2a6ff"),0.32,1.18,2)
    sfx_requested.emit("true_cast",-8.0,0.88)

func _magic_missiles() -> void:
    if not _spend_resource(28.0):
        damage_text_requested.emit(global_position+Vector2(0,-88),"LOW ARCANA",Color("#b7a9ff"))
        return
    ability_one_cooldown=2.4
    attack_lock=0.30
    _set_action_pose("wizard_missiles",0.30)
    for offset: float in [-0.18,-0.09,0.0,0.09,0.18]:
        _spawn_bolt(16.0*damage_multiplier,930.0,offset,Color("#b7a5ff"),0.06,0.68)
    sfx_requested.emit("wizard_cast",-6.0,1.32)

func _time_warp() -> void:
    if not _spend_resource(32.0):
        damage_text_requested.emit(global_position+Vector2(0,-88),"LOW ARCANA",Color("#b7a9ff"))
        return
    ability_two_cooldown=5.4
    wizard_focus_time=5.0
    invulnerable=maxf(invulnerable,0.65)
    _set_action_pose("wizard_time",0.42)
    sfx_requested.emit("phase_shift",-7.0,0.68)
    damage_text_requested.emit(global_position+Vector2(0,-94),"TIME WARP",Color("#c8bcff"))

func _arcane_singularity() -> void:
    resource=0.0
    resource_changed.emit(resource,max_resource)
    attack_lock=0.82
    invulnerable=0.52
    _set_action_pose("wizard_singularity",0.82)
    var center: Vector2 = global_position+aim_direction*190.0+Vector2(0,-26)
    request_flash.emit(center,Color("#b48cff"))
    var query: PhysicsShapeQueryParameters2D = PhysicsShapeQueryParameters2D.new()
    var circle: CircleShape2D = CircleShape2D.new()
    circle.radius=205.0
    query.shape=circle
    query.transform=Transform2D(0.0,center)
    query.collision_mask=2
    var hits: Array[Dictionary] = get_world_2d().direct_space_state.intersect_shape(query,32)
    for result: Dictionary in hits:
        var target=result.get("collider")
        if target and target.has_method("take_damage"):
            target.take_damage(98.0*damage_multiplier,signf(target.global_position.x-center.x)*780.0,center,1.0)
    _spawn_spell_burst(center,205.0,Color("#b48cff"))
    sfx_requested.emit("mortal_spell",-2.0,0.66)
    damage_text_requested.emit(global_position+Vector2(0,-100),"ARCANE SINGULARITY",Color("#d1c2ff"))

func _ranger_light_attack() -> void:
    ranger_shot_count = posmod(ranger_shot_count+1,3)
    attack_lock = 0.14
    _set_action_pose("ranger_shot",0.14)
    var marked: bool = ranger_shot_count==0
    var amount: float = 29.0 if marked else 18.0
    var stun: float = 0.18 if marked else 0.0
    var color: Color = Color("#d2ef8f") if marked else Color("#96d67b")
    sfx_requested.emit("bow_shot",-9.0,1.06 if not marked else 0.90)
    _spawn_bolt(amount*damage_multiplier,920.0,0.0,color,stun,0.76 if not marked else 0.90)
    if marked:
        sfx_requested.emit("hunt_mark",-10.0,1.0)
        damage_text_requested.emit(global_position+Vector2(0,-88),"MARKED QUARRY",Color("#d9f2a0"))

func _ranger_heavy_attack() -> void:
    attack_lock = 0.31
    combo_timer = 0.0
    velocity.x += facing*95.0
    _set_action_pose("ranger_sweep",0.31)
    sfx_requested.emit("slash",-8.0,0.88)
    await get_tree().create_timer(0.09).timeout
    if not is_inside_tree():
        return
    _strike(37.0*damage_multiplier,92.0,52.0,520.0,0.16)

func _aimed_shot() -> void:
    if not _spend_resource(26.0):
        damage_text_requested.emit(global_position+Vector2(0,-88),"LOW HUNT",Color("#9ad374"))
        return
    ability_one_cooldown = 2.45
    attack_lock = 0.42
    _set_action_pose("ranger_aimed",0.42)
    sfx_requested.emit("bow_shot",-5.0,0.72)
    await get_tree().create_timer(0.14).timeout
    if not is_inside_tree():
        return
    _spawn_bolt(58.0*damage_multiplier,1100.0,0.0,Color("#e0f59a"),0.34,1.02,1)

func _natures_favor() -> void:
    if not _spend_resource(34.0):
        damage_text_requested.emit(global_position+Vector2(0,-88),"LOW HUNT",Color("#9ad374"))
        return
    ability_two_cooldown = 5.0
    attack_lock = 0.34
    heal(30.0)
    invulnerable = maxf(invulnerable,0.34)
    _set_action_pose("ranger_nature",0.34)
    sfx_requested.emit("nature_favor",-5.0,1.0)
    request_flash.emit(global_position+Vector2(0,-28),Color("#9fe386"))
    damage_text_requested.emit(global_position+Vector2(0,-98),"NATURE'S FAVOR",Color("#b8efa0"))

func _predators_focus() -> void:
    resource = 0.0
    resource_changed.emit(resource,max_resource)
    ultimate_time = 6.0
    damage_multiplier = 1.35*permanent_damage_multiplier
    invulnerable = 0.24
    _set_action_pose("ranger_predator",0.46)
    sfx_requested.emit("hunt_mark",-4.0,0.76)
    request_flash.emit(global_position+Vector2(0,-30),Color("#d4ef8b"))
    damage_text_requested.emit(global_position+Vector2(0,-104),"PREDATOR'S FOCUS",Color("#e3f5a0"))

func _cleric_light_attack() -> void:
    combo_step = (combo_step+1) if combo_timer>0.0 else 1
    if combo_step>3:
        combo_step=1
    combo_timer=0.44
    var locks: Array[float]=[0.16,0.18,0.25]
    var damages: Array[float]=[17.0,20.0,29.0]
    attack_lock=locks[combo_step-1]
    _set_action_pose("cleric_light_%d" % combo_step,attack_lock)
    sfx_requested.emit("slash",-10.0,0.94+float(combo_step)*0.04)
    _strike(damages[combo_step-1]*damage_multiplier,70.0+float(combo_step)*5.0,50.0,300.0+float(combo_step)*35.0)

func _cleric_heavy_attack() -> void:
    attack_lock=0.34
    _set_action_pose("cleric_bolt",0.34)
    sfx_requested.emit("true_cast",-11.0,1.26)
    await get_tree().create_timer(0.10).timeout
    if not is_inside_tree():
        return
    _spawn_bolt(31.0*damage_multiplier,720.0,0.0,Color("#d8ecff"),0.12,0.90)

func _cleric_smite() -> void:
    if not _spend_resource(24.0):
        damage_text_requested.emit(global_position+Vector2(0,-88),"LOW GRACE",Color("#c5def0"))
        return
    ability_one_cooldown=2.8
    attack_lock=0.40
    _set_action_pose("cleric_smite",0.40)
    sfx_requested.emit("cleric_smite",-4.0,0.92)

    var query: PhysicsShapeQueryParameters2D=PhysicsShapeQueryParameters2D.new()
    var circle: CircleShape2D=CircleShape2D.new()
    circle.radius=118.0
    query.shape=circle
    query.transform=Transform2D(0.0,global_position+Vector2(facing*35.0,-26.0))
    query.collision_mask=2
    query.exclude=[get_rid()]
    var hits: Array[Dictionary]=get_world_2d().direct_space_state.intersect_shape(query,24)
    for result: Dictionary in hits:
        var target_hit: Variant=result.get("collider")
        if target_hit and target_hit.has_method("take_damage"):
            var direction: float=signf(target_hit.global_position.x-global_position.x)
            target_hit.take_damage(42.0*damage_multiplier,520.0*direction,global_position,0.40)
    _spawn_spell_burst(global_position+Vector2(facing*35.0,-26.0),118.0,Color("#d7eaff"))
    request_flash.emit(global_position+Vector2(facing*35.0,-26.0),Color("#e6f2ff"))

func _rejuvenation() -> void:
    if not _spend_resource(30.0):
        damage_text_requested.emit(global_position+Vector2(0,-88),"LOW GRACE",Color("#c5def0"))
        return
    ability_two_cooldown=5.4
    attack_lock=0.38
    heal(42.0)
    invulnerable=maxf(invulnerable,0.24)
    _set_action_pose("cleric_rejuvenate",0.38)
    sfx_requested.emit("rejuvenate",-4.0,1.0)
    request_flash.emit(global_position+Vector2(0,-28),Color("#c8ebdf"))
    damage_text_requested.emit(global_position+Vector2(0,-100),"REJUVENATION",Color("#d6f5e9"))

func _divine_intervention() -> void:
    resource=0.0
    resource_changed.emit(resource,max_resource)
    ultimate_time=2.2
    attack_lock=0.72
    invulnerable=1.10
    heal(58.0)
    _set_action_pose("cleric_intervention",0.72)
    sfx_requested.emit("divine_intervention",-2.0,0.88)
    damage_text_requested.emit(global_position+Vector2(0,-108),"DIVINE INTERVENTION",Color("#eef7ff"))
    request_flash.emit(global_position+Vector2(0,-28),Color("#e0f1ff"))

    var query: PhysicsShapeQueryParameters2D=PhysicsShapeQueryParameters2D.new()
    var circle: CircleShape2D=CircleShape2D.new()
    circle.radius=175.0
    query.shape=circle
    query.transform=Transform2D(0.0,global_position+Vector2(0,-24))
    query.collision_mask=2
    query.exclude=[get_rid()]
    var hits: Array[Dictionary]=get_world_2d().direct_space_state.intersect_shape(query,32)
    for result: Dictionary in hits:
        var target_hit: Variant=result.get("collider")
        if target_hit and target_hit.has_method("take_damage"):
            var direction: float=signf(target_hit.global_position.x-global_position.x)
            target_hit.take_damage(58.0*damage_multiplier,650.0*direction,global_position,0.58)
    _spawn_spell_burst(global_position+Vector2(0,-24),175.0,Color("#dbeeff"))


func _monk_light_attack() -> void:
    combo_step=(combo_step+1) if combo_timer>0.0 else 1
    if combo_step>4:
        combo_step=1
    combo_timer=0.32
    var locks: Array[float]=[0.10,0.11,0.12,0.18]
    var damages: Array[float]=[13.0,15.0,17.0,25.0]
    var reaches: Array[float]=[67.0,70.0,74.0,86.0]
    attack_lock=locks[combo_step-1]
    _set_action_pose("monk_light_%d" % combo_step,attack_lock)
    sfx_requested.emit("monk_strike",-11.0,1.12+float(combo_step)*0.05)
    _strike(damages[combo_step-1]*damage_multiplier,reaches[combo_step-1],48.0,250.0+float(combo_step)*45.0,0.05)
    velocity.x+=facing*(28.0+float(combo_step)*10.0)

func _monk_heavy_attack() -> void:
    attack_lock=0.29
    combo_timer=0.0
    _set_action_pose("monk_palm",0.29)
    sfx_requested.emit("monk_strike",-7.0,0.80)
    await get_tree().create_timer(0.09).timeout
    if not is_inside_tree():
        return
    _strike(39.0*damage_multiplier,98.0,58.0,720.0,0.28)
    request_flash.emit(global_position+Vector2(facing*45,-28),Color("#94ead9"))

func _monk_flurry() -> void:
    if not _spend_resource(24.0):
        damage_text_requested.emit(global_position+Vector2(0,-88),"LOW CHI",Color("#8de0d0"))
        return
    ability_one_cooldown=2.8
    attack_lock=0.52
    invulnerable=maxf(invulnerable,0.18)
    _set_action_pose("monk_flurry",0.52)
    for i: int in range(6):
        if not is_inside_tree():
            return
        _strike((10.0+float(i))*damage_multiplier,82.0,52.0,210.0+float(i)*25.0,0.04)
        sfx_requested.emit("monk_strike",-12.0,1.18+float(i)*0.035)
        velocity.x=facing*105.0
        await get_tree().create_timer(0.065).timeout

func _inner_peace() -> void:
    if not _spend_resource(34.0):
        damage_text_requested.emit(global_position+Vector2(0,-88),"LOW CHI",Color("#8de0d0"))
        return
    ability_two_cooldown=7.0
    inner_peace_time=3.8
    attack_lock=0.34
    heal(24.0)
    _set_action_pose("monk_inner_peace",0.34)
    request_flash.emit(global_position+Vector2(0,-30),Color("#a8f4df"))
    damage_text_requested.emit(global_position+Vector2(0,-100),"INNER PEACE",Color("#a8f4df"))
    sfx_requested.emit("inner_peace",-6.0,1.0)

func _hundred_hands() -> void:
    resource=0.0
    resource_changed.emit(resource,max_resource)
    ultimate_time=1.35
    attack_lock=1.25
    invulnerable=1.18
    _set_action_pose("monk_hundred_hands",1.25)
    damage_text_requested.emit(global_position+Vector2(0,-106),"HUNDRED HANDS",Color("#a6f2df"))
    sfx_requested.emit("ultimate",-5.0,1.18)
    for i: int in range(12):
        if not is_inside_tree():
            return
        _strike((10.5+float(i)*0.65)*damage_multiplier,88.0,54.0,220.0+float(i)*16.0,0.04)
        sfx_requested.emit("monk_strike",-13.0,1.18+float(i%4)*0.05)
        if i%3==0:
            _spawn_afterimage()
        velocity.x=facing*135.0
        await get_tree().create_timer(0.055).timeout
    _strike(42.0*damage_multiplier,118.0,70.0,760.0,0.34)
    request_flash.emit(global_position+Vector2(facing*55,-30),Color("#b6ffe9"))


func _fighter_light_attack() -> void:
    combo_step = (combo_step+1) if combo_timer>0.0 else 1
    if combo_step>3:
        combo_step=1
    combo_timer=0.38
    var locks: Array[float]=[0.13,0.15,0.21]
    var damages: Array[float]=[20.0,24.0,34.0]
    var reaches: Array[float]=[76.0,82.0,94.0]
    attack_lock=locks[combo_step-1]
    _set_action_pose("fighter_light_%d" % combo_step,attack_lock)
    sfx_requested.emit("blade_clash",-10.0,1.15+float(combo_step)*0.04)
    _strike(damages[combo_step-1]*damage_multiplier,reaches[combo_step-1],52.0,330.0+float(combo_step)*60.0,0.05)
    velocity.x += facing*(34.0+float(combo_step)*12.0)

func _fighter_heavy_attack() -> void:
    attack_lock=0.34
    combo_timer=0.0
    _set_action_pose("fighter_heavy",0.34)
    sfx_requested.emit("blade_clash",-6.0,0.86)
    await get_tree().create_timer(0.10).timeout
    if not is_inside_tree():
        return
    velocity.x += facing*120.0
    _strike(46.0*damage_multiplier,116.0,56.0,610.0,0.20)
    _gain_resource(7.0)

func _fighter_parry() -> void:
    ability_one_cooldown=2.2
    attack_lock=0.22
    counter_time=0.28
    _set_action_pose("fighter_parry",0.28)
    sfx_requested.emit("guard",-10.0,1.18)
    request_flash.emit(global_position+Vector2(facing*10,-36),Color("#f1d28b"))

func _fighter_riposte() -> void:
    if not _spend_resource(24.0):
        damage_text_requested.emit(global_position+Vector2(0,-88),"LOW MOMENTUM",Color("#e5c27e"))
        return
    ability_two_cooldown=2.8
    attack_lock=0.34
    fighter_rush_time=0.34
    invulnerable=maxf(invulnerable,0.20)
    _set_action_pose("fighter_riposte",0.34)
    sfx_requested.emit("riposte",-5.0,1.0)
    velocity.x=facing*760.0
    await get_tree().create_timer(0.08).timeout
    if not is_inside_tree():
        return
    _strike(58.0*damage_multiplier,126.0,58.0,720.0,0.32)

func _relentless_assault() -> void:
    resource=0.0
    resource_changed.emit(resource,max_resource)
    ultimate_time=1.25
    attack_lock=1.20
    invulnerable=1.10
    _set_action_pose("fighter_ultimate",1.20)
    sfx_requested.emit("ultimate",-4.0,1.08)
    damage_text_requested.emit(global_position+Vector2(0,-104),"RELENTLESS ASSAULT",Color("#f4ce85"))
    for i: int in range(7):
        if not is_inside_tree():
            return
        facing = facing if i%2==0 else -facing
        velocity.x=facing*310.0
        _strike((22.0+float(i)*2.0)*damage_multiplier,100.0,62.0,420.0+float(i)*35.0,0.10)
        sfx_requested.emit("blade_clash",-10.0,1.0+float(i)*0.035)
        request_flash.emit(global_position+Vector2(facing*34,-30),Color("#e5bc70"))
        await get_tree().create_timer(0.11).timeout
    facing=-facing
    _strike(48.0*damage_multiplier,128.0,70.0,760.0,0.36)

func _fighter_counterstrike() -> void:
    if hero_class!="fighter" or health<=0.0:
        return
    _set_action_pose("fighter_counter",0.22)
    _strike(44.0*damage_multiplier,112.0,60.0,660.0,0.30)
    sfx_requested.emit("riposte",-4.0,1.16)


func _barbarian_light_attack() -> void:
    combo_step = (combo_step+1) if combo_timer>0.0 else 1
    if combo_step>3:
        combo_step = 1
    combo_timer = 0.42
    var locks: Array[float] = [0.16,0.18,0.25]
    var damages: Array[float] = [24.0,29.0,43.0]
    var reaches: Array[float] = [76.0,82.0,92.0]
    attack_lock = locks[combo_step-1]
    velocity.x += facing*(54.0+float(combo_step)*16.0)
    _set_action_pose("barbarian_light_%d" % combo_step,attack_lock)
    sfx_requested.emit("axe_swing",-7.0,0.88+float(combo_step)*0.05)
    _strike(damages[combo_step-1]*damage_multiplier,reaches[combo_step-1],55.0,410.0+float(combo_step)*55.0)

func _barbarian_heavy_attack() -> void:
    attack_lock = 0.48
    combo_timer = 0.0
    _set_action_pose("barbarian_heavy",0.48)
    sfx_requested.emit("axe_swing",-4.0,0.72)
    await get_tree().create_timer(0.16).timeout
    if not is_inside_tree():
        return
    _strike(62.0*damage_multiplier,112.0,70.0,760.0,0.30)
    _gain_resource(9.0)

func _ground_slam() -> void:
    if not _spend_resource(26.0):
        damage_text_requested.emit(global_position+Vector2(0,-88),"LOW FURY",Color("#e98867"))
        return
    ability_one_cooldown = 3.0
    attack_lock = 0.46
    _set_action_pose("barbarian_slam",0.46)
    velocity.y = 110.0 if not is_on_floor() else 0.0
    sfx_requested.emit("ground_slam",-3.0,0.86)
    await get_tree().create_timer(0.15).timeout
    if not is_inside_tree():
        return

    var query: PhysicsShapeQueryParameters2D = PhysicsShapeQueryParameters2D.new()
    var circle: CircleShape2D = CircleShape2D.new()
    circle.radius = 138.0
    query.shape = circle
    query.transform = Transform2D(0.0,global_position+Vector2(0,-12))
    query.collision_mask = 2
    query.exclude = [get_rid()]
    var hits: Array[Dictionary] = get_world_2d().direct_space_state.intersect_shape(query,28)
    for result: Dictionary in hits:
        var target_hit: Variant = result.get("collider")
        if target_hit and target_hit.has_method("take_damage"):
            var direction: float = signf(target_hit.global_position.x-global_position.x)
            target_hit.take_damage(38.0*damage_multiplier,620.0*direction,global_position,0.42)
    request_flash.emit(global_position+Vector2(0,-10),Color("#e77453"))
    _spawn_spell_burst(global_position+Vector2(0,-10),138.0,Color("#d85f45"))

func _berserk() -> void:
    if not _spend_resource(38.0):
        damage_text_requested.emit(global_position+Vector2(0,-88),"LOW FURY",Color("#e98867"))
        return
    ability_two_cooldown = 7.0
    berserk_time = 5.2
    damage_multiplier = 1.40*permanent_damage_multiplier
    invulnerable = maxf(invulnerable,0.18)
    _set_action_pose("barbarian_berserk",0.42)
    sfx_requested.emit("stone_roar",-6.0,1.12)
    request_flash.emit(global_position+Vector2(0,-32),Color("#ef6b4d"))
    damage_text_requested.emit(global_position+Vector2(0,-102),"BERSERK",Color("#ff9a70"))

func _worldbreaker() -> void:
    resource = 0.0
    resource_changed.emit(resource,max_resource)
    attack_lock = 0.82
    invulnerable = 0.50
    _set_action_pose("barbarian_worldbreaker",0.82)
    sfx_requested.emit("ground_slam",-1.0,0.66)
    damage_text_requested.emit(global_position+Vector2(0,-108),"WORLDBREAKER",Color("#ff9d73"))
    await get_tree().create_timer(0.22).timeout
    if not is_inside_tree():
        return

    var query: PhysicsShapeQueryParameters2D = PhysicsShapeQueryParameters2D.new()
    var circle: CircleShape2D = CircleShape2D.new()
    circle.radius = 230.0
    query.shape = circle
    query.transform = Transform2D(0.0,global_position+Vector2(0,-20))
    query.collision_mask = 2
    query.exclude = [get_rid()]
    var hits: Array[Dictionary] = get_world_2d().direct_space_state.intersect_shape(query,40)
    for result: Dictionary in hits:
        var target_hit: Variant = result.get("collider")
        if target_hit and target_hit.has_method("take_damage"):
            var direction: float = signf(target_hit.global_position.x-global_position.x)
            target_hit.take_damage(86.0*damage_multiplier,920.0*direction,global_position,0.80)
    request_flash.emit(global_position+Vector2(0,-16),Color("#ff704f"))
    _spawn_spell_burst(global_position+Vector2(0,-16),230.0,Color("#e96245"))


func _archer_light_attack() -> void:
    attack_lock = 0.12
    _set_action_pose("archer_shot",0.12)
    sfx_requested.emit("bow_shot",-9.0,1.16)
    _spawn_bolt(17.0*damage_multiplier,900.0,0.0,Color("#8ee3aa"),0.0,0.72)

func _archer_heavy_attack() -> void:
    attack_lock = 0.30
    _set_action_pose("archer_power",0.30)
    sfx_requested.emit("bow_shot",-7.0,0.86)
    await get_tree().create_timer(0.10).timeout
    if not is_inside_tree():
        return
    _spawn_bolt(35.0*damage_multiplier,780.0,0.0,Color("#b6eda2"),0.18,0.92)

func _piercing_arrow() -> void:
    if not _spend_resource(22.0):
        damage_text_requested.emit(global_position+Vector2(0,-86),"LOW FOCUS",Color("#8ce6ad"))
        return
    ability_one_cooldown = 2.4
    attack_lock = 0.34
    _set_action_pose("archer_pierce",0.34)
    sfx_requested.emit("bow_shot",-6.0,0.72)
    await get_tree().create_timer(0.10).timeout
    if not is_inside_tree():
        return
    _spawn_bolt(48.0*damage_multiplier,1040.0,0.0,Color("#d4f59a"),0.22,1.0,2)

func _arrow_rain() -> void:
    if not _spend_resource(34.0):
        damage_text_requested.emit(global_position+Vector2(0,-86),"LOW FOCUS",Color("#8ce6ad"))
        return
    ability_two_cooldown = 4.2
    attack_lock = 0.48
    _set_action_pose("archer_rain",0.48)
    sfx_requested.emit("bow_shot",-8.0,1.02)
    var center_x: float = global_position.x+facing*220.0
    for i: int in range(6):
        var at: Vector2 = Vector2(center_x+facing*(float(i)-2.5)*42.0,global_position.y-270.0-float(i%2)*24.0)
        var direction: Vector2 = Vector2(facing*0.12,1.0)
        _spawn_custom_bolt(at,direction,690.0,24.0*damage_multiplier,0.08,Color("#82dca0"),0.72,0)
    request_flash.emit(Vector2(center_x,global_position.y-80.0),Color("#72d6a0"))

func _perfect_volley() -> void:
    resource = 0.0
    resource_changed.emit(resource,max_resource)
    attack_lock = 0.68
    _set_action_pose("archer_ultimate",0.68)
    sfx_requested.emit("ultimate",-5.0,1.12)
    sfx_requested.emit("bow_shot",-5.0,0.78)
    damage_text_requested.emit(global_position+Vector2(0,-96),"PERFECT VOLLEY",Color("#bcf5a2"))
    request_flash.emit(global_position+Vector2(0,-30),Color("#8de0a2"))
    for i: int in range(7):
        var offset: float = (float(i)-3.0)*0.075
        _spawn_bolt(29.0*damage_multiplier,960.0,offset,Color("#a4ee9d"),0.08,0.78)

func _on_hero_bolt_hit(amount: float) -> void:
    if hero_class == "archer":
        _gain_resource(4.0+amount*0.10)
    elif hero_class == "ranger":
        _gain_resource(5.0+amount*0.08)
    elif hero_class == "cleric":
        _gain_resource(3.5+amount*0.06)
    elif hero_class == "bard":
        _gain_resource(5.0+amount*0.08)
    elif hero_class == "druid":
        _gain_resource(4.0+amount*0.06)
    elif hero_class == "sorcerer":
        _gain_resource(5.0+amount*0.08)
    elif hero_class == "warlock":
        _gain_resource(5.0+amount*0.07)
    elif hero_class == "wizard":
        _gain_resource(2.5+amount*0.035)


func _paladin_light_attack() -> void:
    combo_step = (combo_step+1) if combo_timer>0.0 else 1
    if combo_step>3:
        combo_step = 1
    combo_timer = 0.46
    var locks: Array[float] = [0.17,0.19,0.28]
    var damages: Array[float] = [20.0,24.0,36.0]
    attack_lock = locks[combo_step-1]
    _set_action_pose("paladin_light_%d" % combo_step,attack_lock)
    sfx_requested.emit("slash",-7.0,0.86+float(combo_step)*0.05)
    _strike(damages[combo_step-1]*damage_multiplier,72.0+float(combo_step)*5.0,48.0,320.0)

func _paladin_heavy_attack() -> void:
    attack_lock = 0.46
    _set_action_pose("paladin_smite",0.46)
    velocity.x += facing*95.0
    sfx_requested.emit("heavy",-4.0,0.78)
    await get_tree().create_timer(0.15).timeout
    if not is_inside_tree():
        return
    _strike(56.0*damage_multiplier,98.0,58.0,650.0,0.24)
    _gain_resource(8.0)

func _divine_guard() -> void:
    ability_one_cooldown = 2.8
    attack_lock = 0.16
    guard_time = 0.82
    parry_time = 0.22
    _set_action_pose("paladin_guard",0.82)
    sfx_requested.emit("guard",-6.0,1.0)
    request_flash.emit(global_position+Vector2(0,-30),Color("#f6e58c"))

func _sacred_nova() -> void:
    if not _spend_resource(28.0):
        damage_text_requested.emit(global_position+Vector2(0,-86),"LOW FAITH",Color("#f4df84"))
        return
    ability_two_cooldown = 4.0
    attack_lock = 0.42
    _set_action_pose("paladin_nova",0.42)
    heal(18.0)
    var query: PhysicsShapeQueryParameters2D = PhysicsShapeQueryParameters2D.new()
    var circle: CircleShape2D = CircleShape2D.new()
    circle.radius = 132.0
    query.shape = circle
    query.transform = Transform2D(0.0,global_position+Vector2(0,-26))
    query.collision_mask = 2
    query.exclude = [get_rid()]
    var hits: Array[Dictionary] = get_world_2d().direct_space_state.intersect_shape(query,28)
    for result: Dictionary in hits:
        var target_hit: Variant = result.get("collider")
        if target_hit and target_hit.has_method("take_damage"):
            var direction: float = signf(target_hit.global_position.x-global_position.x)
            target_hit.take_damage(30.0*damage_multiplier,460.0*direction,global_position,0.28)
    request_flash.emit(global_position+Vector2(0,-24),Color("#f5e679"))
    _spawn_spell_burst(global_position+Vector2(0,-24),132.0,Color("#f0d95e"))
    sfx_requested.emit("ultimate",-8.0,1.28)

func _judgment() -> void:
    resource = 0.0
    resource_changed.emit(resource,max_resource)
    attack_lock = 0.72
    sacred_armor_time = 5.5
    invulnerable = 0.35
    _set_action_pose("paladin_judgment",0.72)
    heal(34.0)
    request_flash.emit(global_position+Vector2(0,-28),Color("#fff0a0"))
    damage_text_requested.emit(global_position+Vector2(0,-98),"JUDGMENT",Color("#fff0a0"))
    _spawn_spell_burst(global_position+Vector2(0,-26),190.0,Color("#f6df75"))
    var query: PhysicsShapeQueryParameters2D = PhysicsShapeQueryParameters2D.new()
    var circle: CircleShape2D = CircleShape2D.new()
    circle.radius = 190.0
    query.shape = circle
    query.transform = Transform2D(0.0,global_position+Vector2(0,-26))
    query.collision_mask = 2
    query.exclude = [get_rid()]
    var hits: Array[Dictionary] = get_world_2d().direct_space_state.intersect_shape(query,32)
    for result: Dictionary in hits:
        var target_hit: Variant = result.get("collider")
        if target_hit and target_hit.has_method("take_damage"):
            var direction: float = signf(target_hit.global_position.x-global_position.x)
            target_hit.take_damage(68.0*damage_multiplier,720.0*direction,global_position,0.65)
    sfx_requested.emit("ultimate",-2.0,0.88)


func _rogue_light_attack() -> void:
    combo_step = (combo_step + 1) if combo_timer > 0.0 else 1
    if combo_step > 4:
        combo_step = 1
    combo_timer = 0.34
    var locks: Array[float] = [0.10,0.11,0.12,0.19]
    var damages: Array[float] = [13.0,15.0,17.0,27.0]
    var reaches: Array[float] = [54.0,57.0,60.0,70.0]
    attack_lock = locks[combo_step-1]
    velocity.x += facing * (36.0 + float(combo_step)*8.0)
    _set_action_pose("rogue_light_%d" % combo_step,attack_lock)
    sfx_requested.emit("slash",-9.0,1.22+float(combo_step)*0.05)
    _strike(damages[combo_step-1]*damage_multiplier,reaches[combo_step-1],40.0,210.0+float(combo_step)*35.0)

func _rogue_heavy_attack() -> void:
    attack_lock = 0.28
    combo_timer = 0.0
    velocity.x = facing * 510.0
    invulnerable = maxf(invulnerable,0.12)
    _set_action_pose("rogue_backstab",0.28)
    sfx_requested.emit("dash",-8.0,1.22)
    await get_tree().create_timer(0.08).timeout
    if not is_inside_tree():
        return
    _strike(39.0*damage_multiplier,82.0,42.0,520.0,0.22)

func _smoke_step() -> void:
    if not _spend_resource(24.0):
        damage_text_requested.emit(global_position+Vector2(0,-86),"LOW SHADOW",Color("#c99cff"))
        return
    ability_one_cooldown = 2.15
    attack_lock = 0.18
    invulnerable = 0.52
    velocity.x = facing * 1120.0
    _set_action_pose("rogue_smoke",0.26)
    sfx_requested.emit("teleport",-6.0,1.38)
    request_flash.emit(global_position+Vector2(0,-28),Color("#8c5bc8"))
    _spawn_afterimage()

func _fan_of_knives() -> void:
    if not _spend_resource(34.0):
        damage_text_requested.emit(global_position+Vector2(0,-86),"LOW SHADOW",Color("#c99cff"))
        return
    ability_two_cooldown = 3.2
    attack_lock = 0.32
    _set_action_pose("rogue_fan",0.32)
    sfx_requested.emit("whirlwind",-8.0,1.42)
    var query: PhysicsShapeQueryParameters2D = PhysicsShapeQueryParameters2D.new()
    var circle: CircleShape2D = CircleShape2D.new()
    circle.radius = 118.0
    query.shape = circle
    query.transform = Transform2D(0.0,global_position+Vector2(0,-24))
    query.collision_mask = 2
    query.exclude = [get_rid()]
    var hits: Array[Dictionary] = get_world_2d().direct_space_state.intersect_shape(query,24)
    for result: Dictionary in hits:
        var target: Variant = result.get("collider")
        if target and target.has_method("take_damage"):
            var direction: float = signf(target.global_position.x-global_position.x)
            target.take_damage(26.0*damage_multiplier,390.0*direction,global_position,0.16)
    request_flash.emit(global_position+Vector2(0,-24),Color("#c080ff"))
    _spawn_spell_burst(global_position+Vector2(0,-24),118.0,Color("#b36cff"))

func _shadow_dance() -> void:
    resource = 0.0
    resource_changed.emit(resource,max_resource)
    ultimate_time = 5.5
    damage_multiplier = 1.48 * permanent_damage_multiplier
    invulnerable = 0.85
    dash_cooldown = 0.0
    _set_action_pose("rogue_ultimate",0.55)
    sfx_requested.emit("ultimate",-3.0,1.28)
    request_flash.emit(global_position+Vector2(0,-26),Color("#c67cff"))
    damage_text_requested.emit(global_position+Vector2(0,-94),"SHADOW DANCE",Color("#d6a1ff"))
    _spawn_afterimage()

func _set_action_pose(kind: String, duration: float) -> void:
    action_visual_kind = kind
    action_visual_time = maxf(duration,0.01)
    action_visual_total = action_visual_time

func _spawn_afterimage() -> void:
    if not is_inside_tree():
        return
    var tint: Color = Color("#b579ff")
    if hero_class == "mage":
        tint = Color("#75cfff")
    elif hero_class == "paladin":
        tint = Color("#f2df83")
    elif hero_class == "archer":
        tint = Color("#7de0a4")
    elif hero_class == "barbarian":
        tint = Color("#e07b59")
    elif hero_class == "fighter":
        tint = Color("#e3bd76")
    elif hero_class == "monk":
        tint = Color("#7edccb")
    elif hero_class == "ranger":
        tint = Color("#91d16f")
    elif hero_class == "cleric":
        tint = Color("#b9dcef")
    elif hero_class == "bard": tint = Color("#e88fc8")
    elif hero_class == "druid": tint = Color("#75c77c")
    elif hero_class == "sorcerer": tint = Color("#ff8b6b")
    elif hero_class == "warlock": tint = Color("#a26bd8")
    elif hero_class == "wizard": tint = Color("#9d8cff")
    elif hero_class == "warrior":
        tint = Color("#b9d8e8")
    var echo: HeroEcho = HeroEcho.new().setup(global_position,hero_class,facing,tint,0.19)
    get_parent().add_child(echo)

func _update_animation_state(delta: float) -> void:
    animation_time += delta
    var next_state: String = "idle"
    if action_visual_time > 0.0:
        next_state = "attack"
    elif slide_time > 0.0:
        next_state = "slide"
    elif crouching:
        next_state = "crouch"
    elif dash_time > 0.0:
        next_state = "dash"
    elif is_on_wall_only() and not is_on_floor() and velocity.y > 30.0:
        next_state = "wall_slide"
    elif not is_on_floor():
        next_state = "jump" if velocity.y < 0.0 else "fall"
    elif absf(velocity.x) > 40.0:
        next_state = "run"

    if next_state != animation_state:
        animation_state = next_state
        animation_time = 0.0
        animation_state_changed.emit(animation_state)

    if hero_class == "rogue" and ultimate_time > 0.0 and afterimage_timer <= 0.0:
        afterimage_timer = 0.095
        _spawn_afterimage()

func _spawn_bolt(damage: float, speed: float, angle_offset: float, color: Color, stun: float, size_scale: float = 1.0, pierces: int = 0) -> void:
    var base: Vector2 = aim_direction if aim_direction.length()>0.1 else Vector2(facing,0.0)
    var direction: Vector2 = base.rotated(angle_offset)
    var origin: Vector2 = global_position+Vector2(0,-38)+base*24.0
    _spawn_custom_bolt(origin,direction,speed,damage,stun,color,size_scale,pierces)

func _spawn_custom_bolt(at: Vector2, direction: Vector2, speed: float, damage: float, stun: float, color: Color, size_scale: float = 1.0, pierces: int = 0) -> void:
    var impact_sound: String = "hit"
    if hero_class in ["archer","ranger"]:
        impact_sound = "arrow_hit"
    elif hero_class == "cleric":
        impact_sound = "cleric_smite"
    elif hero_class in ["bard","druid","sorcerer","warlock","wizard"]:
        impact_sound = "hit"
    var bolt: HeroBolt = HeroBolt.new().setup(at,direction,speed,damage,stun,color,size_scale,pierces,impact_sound)
    bolt.sfx_requested.connect(func(id: String, volume_db: float, pitch: float):
        sfx_requested.emit(id,volume_db,pitch)
    )
    if hero_class in ["archer","ranger","cleric","bard","druid","sorcerer","warlock","wizard"]:
        bolt.enemy_hit.connect(_on_hero_bolt_hit)
    get_parent().add_child(bolt)

func _spawn_spell_burst(at: Vector2, radius: float, color: Color) -> void:
    var burst: SpellBurst = SpellBurst.new().setup(at, radius, color)
    get_parent().add_child(burst)

func _strike(damage: float, reach: float, height: float, knockback: float, stun: float = 0.0) -> void:
    var query: PhysicsShapeQueryParameters2D = PhysicsShapeQueryParameters2D.new()
    var rect: RectangleShape2D = RectangleShape2D.new()
    rect.size = Vector2(reach,height)
    var direction: Vector2 = aim_direction if aim_direction.length()>0.1 else Vector2(facing,0.0)
    var center: Vector2 = global_position+Vector2(0,-30)+direction*(reach*0.5+18.0)
    rect.size = Vector2(reach,height)
    query.shape = rect
    query.transform = Transform2D(direction.angle(),center)
    query.collision_mask = 2
    query.exclude = [get_rid()]
    var hits: Array[Dictionary] = get_world_2d().direct_space_state.intersect_shape(query,16)
    var hit_any: bool = false
    for result: Dictionary in hits:
        var target = result.get("collider")
        if target and target.has_method("take_damage"):
            hit_any = true
            var side: float = signf(target.global_position.x-global_position.x)
            if side==0.0: side=facing
            target.take_damage(damage,knockback*side,global_position,stun)
            if hero_class == "warrior": _gain_resource(7.0+damage*0.08)
            elif hero_class == "rogue": _gain_resource(8.0+damage*0.10)
            elif hero_class == "paladin": _gain_resource(5.0+damage*0.06)
            elif hero_class == "barbarian": _gain_resource(7.0+damage*0.09)
            elif hero_class == "fighter": _gain_resource(4.5+damage*0.07)
            elif hero_class == "monk": _gain_resource(5.5+damage*0.075)
            elif hero_class == "ranger": _gain_resource(5.0+damage*0.07)
            elif hero_class == "cleric": _gain_resource(4.0+damage*0.055)
            elif hero_class == "bard": _gain_resource(7.0+damage*0.09)
            elif hero_class == "druid": _gain_resource(5.0+damage*0.07)
            elif hero_class == "sorcerer": _gain_resource(5.0+damage*0.08)
            elif hero_class == "warlock": _gain_resource(6.0+damage*0.08)
            elif hero_class == "wizard": _gain_resource(3.0+damage*0.04)
            request_flash.emit(target.global_position+Vector2(0,-28),Color("#ffe3b2"))
    if hit_any:
        sfx_requested.emit("hit",-3.0,0.96+randf_range(-0.05,0.06))

func take_damage(amount: float, knockback: float = 0.0, _source: Vector2 = Vector2.ZERO) -> void:
    if invulnerable > 0.0 or health <= 0.0:
        return

    if hero_class=="fighter" and counter_time>0.0:
        counter_time=0.0
        invulnerable=0.34
        _gain_resource(30.0)
        request_flash.emit(global_position+Vector2(facing*10,-34),Color("#ffe2a1"))
        damage_text_requested.emit(global_position+Vector2(0,-92),"COUNTER",Color("#f5d48c"))
        sfx_requested.emit("perfect_guard",-3.0,1.18)
        call_deferred("_fighter_counterstrike")
        return

    if hero_class == "paladin" and guard_time > 0.0:
        if parry_time > 0.0:
            _gain_resource(24.0)
            invulnerable = 0.24
            request_flash.emit(global_position+Vector2(0,-28),Color("#fff2a6"))
            damage_text_requested.emit(global_position+Vector2(0,-92),"PERFECT GUARD",Color("#fff0a0"))
            sfx_requested.emit("perfect_guard",-3.0,1.0)
            return
        amount *= 0.30
        knockback *= 0.25
        _gain_resource(12.0)
        damage_text_requested.emit(global_position+Vector2(0,-92),"GUARDED",Color("#f2df88"))

    if sacred_armor_time > 0.0:
        amount *= 0.65
        knockback *= 0.60

    if hero_class=="monk" and inner_peace_time>0.0:
        amount*=0.58
        knockback*=0.50

    if hero_class=="druid" and druid_avatar_time>0.0:
        amount*=0.68
        knockback*=0.70
    amount *= permanent_damage_reduction*incoming_damage_multiplier
    health = maxf(0.0,health-amount)
    invulnerable = 0.55
    last_damage_time = 0.0
    velocity.x = knockback*knockback_multiplier
    velocity.y = -220.0
    health_changed.emit(health,max_health)

    if hero_class == "warrior":
        _gain_resource(amount*0.45)
    elif hero_class == "rogue":
        _gain_resource(amount*0.20)
    elif hero_class == "paladin":
        _gain_resource(amount*0.12)
    elif hero_class == "barbarian":
        _gain_resource(amount*0.42)
    elif hero_class == "fighter":
        _gain_resource(amount*0.16)
    elif hero_class == "monk":
        _gain_resource(amount*0.10)
    elif hero_class == "ranger":
        _gain_resource(amount*0.12)
    elif hero_class == "cleric":
        _gain_resource(amount*0.18)
    elif hero_class == "bard":
        _gain_resource(amount*0.16)
    elif hero_class == "druid":
        _gain_resource(amount*0.20)
    elif hero_class == "sorcerer":
        _gain_resource(amount*0.24)
    elif hero_class == "warlock":
        _gain_resource(amount*0.30)
    elif hero_class == "wizard":
        _gain_resource(amount*0.10)

    _set_action_pose("hurt",0.22)
    request_flash.emit(global_position+Vector2(0,-28),Color("#ff6f73"))
    damage_text_requested.emit(global_position+Vector2(0,-78),"-%d" % int(round(amount)),Color("#ff8f91"))
    sfx_requested.emit("hit",-2.0,0.76)
    if health <= 0.0:
        sfx_requested.emit("death",-2.0,1.0)
        died.emit()

func heal(amount: float) -> void:
    var previous: float = health
    amount *= healing_multiplier
    health = minf(max_health,health+maxf(0.0,amount))
    health_changed.emit(health, max_health)
    var gained: float = health - previous
    if gained > 0.0:
        damage_text_requested.emit(global_position + Vector2(0,-76), "+%d" % int(round(gained)), Color("#89e8b2"))

func _gain_resource(amount: float) -> void:
    amount *= resource_gain_multiplier
    resource = minf(max_resource,resource+amount)
    resource_changed.emit(resource, max_resource)

func _spend_resource(amount: float) -> bool:
    if resource < amount:
        return false
    resource = maxf(0.0, resource - amount)
    resource_changed.emit(resource, max_resource)
    return true

func receive_arcane_shard(final_shard: bool = false) -> void:
    heal(10.0 if not final_shard else 28.0)
    if final_shard:
        resource = max_resource
        resource_changed.emit(resource,max_resource)
        damage_text_requested.emit(global_position + Vector2(0,-102), "ARCANE SET COMPLETE", Color("#8fe5ff"))
        request_flash.emit(global_position + Vector2(0,-28), Color("#7fdcff"))
    elif hero_class == "mage":
        resource = minf(max_resource,resource+18.0)
        resource_changed.emit(resource,max_resource)
    elif hero_class == "rogue":
        _gain_resource(22.0)
    elif hero_class == "paladin":
        _gain_resource(26.0)
    elif hero_class == "archer":
        _gain_resource(24.0)
    elif hero_class == "barbarian":
        _gain_resource(28.0)
    elif hero_class == "fighter":
        _gain_resource(24.0)
    elif hero_class == "monk":
        _gain_resource(26.0)
    elif hero_class == "ranger":
        _gain_resource(25.0)
    elif hero_class == "cleric":
        _gain_resource(28.0)
    elif hero_class == "bard":
        _gain_resource(26.0)
    elif hero_class == "druid":
        _gain_resource(25.0)
    elif hero_class == "sorcerer":
        _gain_resource(28.0)
    elif hero_class == "warlock":
        _gain_resource(30.0)
    elif hero_class == "wizard":
        _gain_resource(22.0)
    else:
        _gain_resource(14.0)


func apply_upgrade(upgrade_id: String) -> void:
    match upgrade_id:
        "vitality":
            max_health += 24.0
            health = max_health
            health_changed.emit(health,max_health)
            damage_text_requested.emit(global_position + Vector2(0,-96),"+24 VITALITY",Color("#8fe8b5"))
        "might":
            permanent_damage_multiplier *= 1.12
            if hero_class=="warrior" and ultimate_time>0.0:
                damage_multiplier=1.65*permanent_damage_multiplier
            elif hero_class=="ranger" and ultimate_time>0.0:
                damage_multiplier=1.35*permanent_damage_multiplier
            elif hero_class=="barbarian" and berserk_time>0.0:
                damage_multiplier=1.40*permanent_damage_multiplier
            else:
                damage_multiplier=permanent_damage_multiplier
            damage_text_requested.emit(global_position + Vector2(0,-96),"+12% MIGHT",Color("#ffc77f"))
        "swiftness":
            move_speed *= 1.08
            acceleration *= 1.08
            air_acceleration *= 1.08
            jump_speed *= 1.05
            dash_speed *= 1.05
            damage_text_requested.emit(global_position + Vector2(0,-96),"SWIFTNESS",Color("#8fdfff"))
        "resilience":
            permanent_damage_reduction *= 0.90
            damage_text_requested.emit(global_position+Vector2(0,-96),"RESILIENCE  -10% DAMAGE",Color("#8fe8d5"))
        "devotion":
            resource_gain_multiplier *= 1.20
            damage_text_requested.emit(global_position+Vector2(0,-96),"DEVOTION  +20% RESOURCE",Color("#d8c5ff"))
        "renewal":
            healing_multiplier *= 1.25
            damage_text_requested.emit(global_position+Vector2(0,-96),"RENEWAL  +25% HEALING",Color("#a6f0b6"))
        "steadfast":
            knockback_multiplier *= 0.75
            damage_text_requested.emit(global_position+Vector2(0,-96),"STEADFAST  -25% KNOCKBACK",Color("#d6c5a2"))
        "ascension":
            starting_resource_floor=maxf(starting_resource_floor,0.35)
            resource=maxf(resource,max_resource*starting_resource_floor)
            resource_changed.emit(resource,max_resource)
            damage_text_requested.emit(global_position+Vector2(0,-96),"ASCENSION  START WITH 35% RESOURCE",Color("#f0d69a"))
    request_flash.emit(global_position + Vector2(0,-28),Color("#9ee8d7"))
    queue_redraw()

func set_controls_locked(locked: bool) -> void:
    controls_locked = locked
    if locked:
        dash_time = 0.0
        attack_lock = maxf(attack_lock,0.08)

func reset_at(where: Vector2) -> void:
    global_position = where
    velocity = Vector2.ZERO
    health = max_health
    if hero_class == "mage":
        resource = max_resource
    elif hero_class == "paladin":
        resource = 20.0
    elif hero_class == "cleric":
        resource = 12.0
    elif hero_class == "bard":
        resource = 10.0
    elif hero_class == "druid":
        resource = 18.0
    elif hero_class == "sorcerer":
        resource = 25.0
    elif hero_class == "warlock":
        resource = 20.0
    elif hero_class == "wizard":
        resource = max_resource
    else:
        resource = 0.0
    resource=maxf(resource,max_resource*starting_resource_floor)
    invulnerable = 1.0
    combo_step = 0
    combo_timer = 0.0
    damage_multiplier = permanent_damage_multiplier
    ultimate_time = 0.0
    ability_one_cooldown = 0.0
    ability_two_cooldown = 0.0
    air_jumps_remaining = max_air_jumps
    dash_buffer = 0.0
    attack_buffer = 0.0
    action_visual_time = 0.0
    action_visual_kind = ""
    animation_state = "idle"
    guard_time = 0.0
    parry_time = 0.0
    sacred_armor_time = 0.0
    berserk_time = 0.0
    counter_time = 0.0
    fighter_rush_time = 0.0
    inner_peace_time = 0.0
    ranger_shot_count = 0
    bard_rally_time = 0.0
    druid_avatar_time = 0.0
    sorcerer_overcharge_time = 0.0
    warlock_pact_time = 0.0
    wizard_focus_time = 0.0
    slide_time = 0.0
    _set_crouching(false)
    landing_visual_time = 0.0
    previous_grounded = false
    health_changed.emit(health,max_health)
    resource_changed.emit(resource, max_resource)
    identity_changed.emit(display_name, resource_name, resource_color, resource_help)
    queue_redraw()

func _draw() -> void:
    draw_set_transform(Vector2(0,13),0.0,Vector2(1.45,0.30))
    draw_circle(Vector2.ZERO,18.0,Color(0.0,0.0,0.0,0.24))
    draw_set_transform(Vector2.ZERO,0.0,Vector2.ONE)

    var run_amount: float = clampf(absf(velocity.x)/maxf(move_speed,1.0),0.0,1.0)
    var gait_wave: float = sin(gait_time)
    var gait: float = gait_wave*8.5*run_amount if is_on_floor() else 0.0
    var breathe: float = sin(animation_time*2.1)*1.35 if animation_state=="idle" else 0.0
    var arm_swing: float = cos(gait_time)*7.0*run_amount if is_on_floor() else 0.0
    var body_scale_y: float = (0.72 if crouching else 1.0)-squash
    var body_scale_x: float = 1.0+squash*0.55
    var body_tilt: float = 0.0
    if animation_state=="run":
        body_tilt = facing*0.045*run_amount
    elif animation_state=="jump":
        body_tilt = facing*0.025
    elif animation_state=="fall":
        body_tilt = -facing*0.018
    elif animation_state=="wall_slide":
        body_tilt = -facing*0.045
    if action_visual_time > 0.0:
        body_tilt *= 0.35
    draw_set_transform(Vector2(0,-2+breathe),body_tilt,Vector2(body_scale_x,body_scale_y))

    if hero_class == "mage":
        var aura: Color = Color(0.34,0.70,1.0,0.34)
        draw_circle(Vector2(0,-34), 31.0, Color(0.18,0.40,0.62,0.12))
        draw_polygon(PackedVector2Array([Vector2(-22,-44),Vector2(19,-44),Vector2(29,3),Vector2(-30,3)]), PackedColorArray([Color("#314968")]))
        draw_polygon(PackedVector2Array([Vector2(-18,-48),Vector2(0,-72),Vector2(20,-48)]), PackedColorArray([Color("#223148")]))
        draw_circle(Vector2(0,-55), 12.0, Color("#e4c2a1"))
        draw_polygon(PackedVector2Array([Vector2(-17,-63),Vector2(1,-91),Vector2(19,-63)]), PackedColorArray([Color("#253550")]))
        draw_line(Vector2(-7,-4), Vector2(-10 + gait,-22), Color("#19283a"), 7.0)
        draw_line(Vector2(7,-4), Vector2(10 - gait,-22), Color("#19283a"), 7.0)
        draw_line(Vector2(facing*16,-40), Vector2(facing*34,-76), Color("#7b6c63"), 4.0)
        draw_circle(Vector2(facing*36,-80), 7.0, Color("#71c7ff"))
        draw_arc(Vector2(0,-34), 38.0, 0, TAU, 28, aura, 2.0)
        var orb_angle: float = gait_time * 0.65
        draw_circle(Vector2(cos(orb_angle)*33.0,-36 + sin(orb_angle)*13.0), 3.5, Color("#c2e8ff"))
    elif hero_class == "rogue":
        var hood_glow: Color = Color("#d4a0ff") if ultimate_time > 0.0 else Color("#9371b5")
        draw_polygon(PackedVector2Array([Vector2(-16,-43),Vector2(15,-43),Vector2(13,-5),Vector2(-13,-5)]),PackedColorArray([Color("#353145")]))
        draw_polygon(PackedVector2Array([Vector2(-17,-57),Vector2(0,-75),Vector2(18,-57),Vector2(12,-42),Vector2(-13,-42)]),PackedColorArray([Color("#282538")]))
        draw_circle(Vector2(0,-53),10.0,Color("#d9b28f"))
        draw_line(Vector2(-7,-5),Vector2(-10+gait,16),Color("#1f2230"),6.0)
        draw_line(Vector2(7,-5),Vector2(10-gait,16),Color("#1f2230"),6.0)
        draw_line(Vector2(facing*10,-31),Vector2(facing*34,-15),hood_glow,3.5)
        draw_line(Vector2(facing*7,-26),Vector2(facing*29,-4),Color("#9ea7b2"),3.0)
        draw_arc(Vector2(0,-34),31.0,0.0,TAU,24,Color(0.56,0.32,0.75,0.20),2.0)
        if ultimate_time > 0.0:
            draw_arc(Vector2(0,-34),38.0,0.0,TAU,26,Color(0.78,0.42,1.0,0.50),3.0)
    elif hero_class == "paladin":
        var holy: Color = Color("#fff0a0") if sacred_armor_time > 0.0 else Color("#e1cc79")
        draw_polygon(PackedVector2Array([Vector2(-20,-44),Vector2(20,-44),Vector2(18,-5),Vector2(-18,-5)]),PackedColorArray([Color("#d8d1bd")]))
        draw_circle(Vector2(0,-56),12.0,Color("#d6b18d"))
        draw_polygon(PackedVector2Array([Vector2(-14,-69),Vector2(14,-69),Vector2(18,-55),Vector2(-18,-55)]),PackedColorArray([Color("#aeb2b0")]))
        draw_line(Vector2(facing*14,-34),Vector2(facing*43,-8),holy,5.0)
        draw_circle(Vector2(-facing*30,-35),19.0,Color("#a9adb0"))
        draw_arc(Vector2(-facing*30,-35),22.0,0.0,TAU,20,holy,4.0)
        draw_line(Vector2(-8,-5),Vector2(-10+gait,16),Color("#8c8f8f"),7.0)
        draw_line(Vector2(8,-5),Vector2(10-gait,16),Color("#8c8f8f"),7.0)
        if guard_time > 0.0:
            draw_arc(Vector2(-facing*31,-35),34.0,-1.25,1.25,20,Color(1.0,0.92,0.55,0.64),5.0)
        if sacred_armor_time > 0.0:
            draw_arc(Vector2(0,-34),40.0,0.0,TAU,28,Color(1.0,0.92,0.55,0.42),3.0)
    elif hero_class == "archer":
        var green: Color = Color("#a8ec9c")
        draw_polygon(PackedVector2Array([Vector2(-17,-43),Vector2(17,-43),Vector2(15,-5),Vector2(-15,-5)]),PackedColorArray([Color("#374839")]))
        draw_circle(Vector2(0,-55),11.0,Color("#d6ad87"))
        draw_polygon(PackedVector2Array([Vector2(-13,-68),Vector2(13,-68),Vector2(17,-55),Vector2(-17,-55)]),PackedColorArray([Color("#53654d")]))
        draw_line(Vector2(-8,-5),Vector2(-10+gait,16),Color("#2b352e"),6.0)
        draw_line(Vector2(8,-5),Vector2(10-gait,16),Color("#2b352e"),6.0)

        # Bow and string.
        var bow_x: float = facing*27.0
        draw_arc(Vector2(bow_x,-35),22.0,-1.35 if facing>0.0 else PI-1.35,1.35 if facing>0.0 else PI+1.35,20,green,4.0)
        draw_line(Vector2(bow_x,-56),Vector2(bow_x,-14),Color("#b7c9a3"),1.5)
        draw_line(Vector2(-facing*11,-58),Vector2(-facing*28,-10),Color("#665b46"),5.0)
        for q: int in range(3):
            draw_line(Vector2(-facing*(25+float(q)*3.0),-56+float(q)*4.0),Vector2(-facing*(10+float(q)*3.0),-78+float(q)*2.0),Color("#a7c694"),2.0)
    elif hero_class == "barbarian":
        var rage_glow: Color = Color("#ff8a63") if berserk_time>0.0 else Color("#d17b5d")
        draw_polygon(
            PackedVector2Array([Vector2(-23,-46),Vector2(23,-46),Vector2(20,-5),Vector2(-20,-5)]),
            PackedColorArray([Color("#5a3d36")])
        )
        draw_polygon(
            PackedVector2Array([Vector2(-25,-47),Vector2(25,-47),Vector2(17,-58),Vector2(-16,-58)]),
            PackedColorArray([Color("#756558")])
        )
        draw_circle(Vector2(0,-59),13.0,Color("#d0a17f"))
        draw_line(Vector2(-7,-66),Vector2(8,-62),Color("#3b2a28"),4.0)
        draw_line(Vector2(-9,-5),Vector2(-12+gait,17),Color("#40302c"),8.0)
        draw_line(Vector2(9,-5),Vector2(12-gait,17),Color("#40302c"),8.0)

        # Double-headed axe.
        var hand: Vector2 = Vector2(facing*14,-34)
        var axe_head: Vector2 = Vector2(facing*43,-10)
        draw_line(hand,axe_head,Color("#70594a"),7.0)
        draw_polygon(
            PackedVector2Array([
                axe_head+Vector2(-facing*4,-15),
                axe_head+Vector2(facing*20,-10),
                axe_head+Vector2(facing*25,5),
                axe_head+Vector2(-facing*4,11)
            ]),
            PackedColorArray([Color("#a49c94")])
        )
        draw_polygon(
            PackedVector2Array([
                axe_head+Vector2(facing*4,-15),
                axe_head+Vector2(-facing*20,-10),
                axe_head+Vector2(-facing*24,5),
                axe_head+Vector2(facing*4,11)
            ]),
            PackedColorArray([Color("#8f8882")])
        )
        draw_line(Vector2(-16,-25),Vector2(16,-25),Color("#8a6548"),4.0)
        if berserk_time>0.0:
            draw_arc(Vector2(0,-34),43.0,0.0,TAU,28,Color(rage_glow.r,rage_glow.g,rage_glow.b,0.44),4.0)
    elif hero_class == "fighter":
        var steel: Color = Color("#697783")
        var accent: Color = Color("#e0b66f")
        draw_circle(Vector2(0,-52),13.0,Color("#d9b497"))
        draw_polygon(PackedVector2Array([Vector2(-19,-43),Vector2(19,-43),Vector2(16,-5),Vector2(-16,-5)]),PackedColorArray([steel]))
        draw_line(Vector2(-9,-5),Vector2(-11+gait,16),Color("#303940"),8.0)
        draw_line(Vector2(9,-5),Vector2(11-gait,16),Color("#303940"),8.0)

        # Buckler and longsword.
        draw_circle(Vector2(-facing*18,-30),11.0,Color("#4d5962"))
        draw_arc(Vector2(-facing*18,-30),11.0,0.0,TAU,18,accent,2.0)
        draw_line(Vector2(facing*15,-35),Vector2(facing*42,-13),Color("#c4c8cb"),5.0)
        draw_line(Vector2(facing*39,-16),Vector2(facing*48,-7),accent,3.0)
        draw_line(Vector2(-13,-18),Vector2(13,-18),Color("#8b6b45"),4.0)
        if counter_time>0.0:
            draw_arc(Vector2(-facing*18,-30),27.0,-1.2,1.2,18,Color(0.95,0.78,0.40,0.52),4.0)
    elif hero_class == "monk":
        var calm: Color=Color("#b5f3e5") if inner_peace_time>0.0 else Color("#7ed8c8")
        draw_circle(Vector2(0,-52),12.0,Color("#d0a98f"))
        draw_polygon(PackedVector2Array([Vector2(-16,-42),Vector2(16,-42),Vector2(13,-5),Vector2(-13,-5)]),PackedColorArray([Color("#485d59")]))
        draw_polygon(PackedVector2Array([Vector2(-17,-43),Vector2(17,-43),Vector2(10,-29),Vector2(-10,-29)]),PackedColorArray([Color("#6b4f42")]))
        draw_line(Vector2(-8,-5),Vector2(-11+gait,16),Color("#2d3b38"),7.0)
        draw_line(Vector2(8,-5),Vector2(11-gait,16),Color("#2d3b38"),7.0)
        draw_line(Vector2(-13,-18),Vector2(13,-18),Color("#c59b62"),4.0)
        draw_line(Vector2(facing*10,-34),Vector2(facing*27,-26),calm,4.0)
        draw_line(Vector2(-facing*10,-32),Vector2(-facing*24,-23),calm,4.0)
        draw_circle(Vector2(facing*4,-52),1.7,Color("#1d2925"))
        if inner_peace_time>0.0:
            draw_arc(Vector2(0,-32),39.0,0.0,TAU,28,Color(0.57,0.94,0.84,0.38),3.0)
    elif hero_class == "ranger":
        var hunt_glow: Color = Color("#e2f2a0") if ultimate_time>0.0 else Color("#8ec96f")
        draw_circle(Vector2(0,-53),12.0,Color("#d2ad8c"))
        draw_polygon(PackedVector2Array([Vector2(-18,-43),Vector2(18,-43),Vector2(15,-5),Vector2(-15,-5)]),PackedColorArray([Color("#425443")]))
        draw_polygon(PackedVector2Array([Vector2(-18,-58),Vector2(0,-72),Vector2(18,-58),Vector2(13,-43),Vector2(-13,-43)]),PackedColorArray([Color("#344638")]))
        draw_line(Vector2(-8,-5),Vector2(-10+gait,16),Color("#29362d"),7.0)
        draw_line(Vector2(8,-5),Vector2(10-gait,16),Color("#29362d"),7.0)
        draw_arc(Vector2(facing*24,-33),24.0,-1.25 if facing>0.0 else PI-1.25,1.25 if facing>0.0 else PI+1.25,18,hunt_glow,4.0)
        draw_line(Vector2(facing*24,-57),Vector2(facing*24,-9),hunt_glow,2.0)
        draw_line(Vector2(-14,-18),Vector2(14,-18),Color("#8a6c47"),4.0)
        if ultimate_time>0.0:
            draw_arc(Vector2(0,-34),39.0,0.0,TAU,26,Color(0.75,0.95,0.40,0.38),3.0)
    elif hero_class == "cleric":
        var grace: Color = Color("#edf7ff") if ultimate_time>0.0 else Color("#b8d8ef")
        draw_circle(Vector2(0,-54),12.0,Color("#d6b395"))
        draw_polygon(PackedVector2Array([Vector2(-20,-44),Vector2(20,-44),Vector2(24,3),Vector2(-24,3)]),PackedColorArray([Color("#596779")]))
        draw_polygon(PackedVector2Array([Vector2(-18,-47),Vector2(18,-47),Vector2(11,-32),Vector2(-11,-32)]),PackedColorArray([Color("#d8d4c9")]))
        draw_line(Vector2(-8,-4),Vector2(-10+gait,16),Color("#303944"),7.0)
        draw_line(Vector2(8,-4),Vector2(10-gait,16),Color("#303944"),7.0)
        draw_line(Vector2(facing*14,-36),Vector2(facing*38,-73),Color("#827163"),5.0)
        draw_circle(Vector2(facing*40,-77),7.0,grace)
        draw_arc(Vector2(facing*40,-77),13.0,0.0,TAU,18,Color(grace.r,grace.g,grace.b,0.35),2.0)
        draw_line(Vector2(-15,-18),Vector2(15,-18),Color("#c7ad76"),4.0)
        if ultimate_time>0.0:
            draw_arc(Vector2(0,-34),42.0,0.0,TAU,28,Color(0.78,0.90,1.0,0.42),3.0)
    elif hero_class in ["bard","druid","sorcerer","warlock","wizard"]:
        var class_color: Color = Color("#e88fc8")
        if hero_class=="druid": class_color=Color("#75c77c")
        elif hero_class=="sorcerer": class_color=Color("#ff8b6b")
        elif hero_class=="warlock": class_color=Color("#a26bd8")
        elif hero_class=="wizard": class_color=Color("#9d8cff")
        draw_polygon(PackedVector2Array([Vector2(-18,-44),Vector2(18,-44),Vector2(15,-5),Vector2(-15,-5)]),PackedColorArray([class_color.darkened(0.58)]))
        draw_circle(Vector2(0,-55),12.0,Color("#ddb996"))
        draw_polygon(PackedVector2Array([Vector2(-16,-64),Vector2(0,-79),Vector2(17,-64)]),PackedColorArray([class_color.darkened(0.42)]))
        draw_line(Vector2(-8,-5),Vector2(-10+gait,16),class_color.darkened(0.66),7.0)
        draw_line(Vector2(8,-5),Vector2(10-gait,16),class_color.darkened(0.66),7.0)
        draw_line(Vector2(facing*14,-36),Vector2(facing*40,-62),class_color.lightened(0.18),5.0)
        draw_circle(Vector2(facing*43,-65),6.0,class_color.lightened(0.30))
        draw_arc(Vector2(0,-34),36.0,0.0,TAU,24,Color(class_color.r,class_color.g,class_color.b,0.24),2.0)
    else:
        var glow: Color = Color("#ffd76d") if ultimate_time > 0.0 else Color("#c7d7df")
        draw_circle(Vector2(0,-50), 13.0, Color("#e7c6a5"))
        draw_polygon(PackedVector2Array([Vector2(-19,-42),Vector2(18,-42),Vector2(15,-5),Vector2(-15,-5)]), PackedColorArray([Color("#596c7c")]))
        draw_line(Vector2(-9,-5), Vector2(-11 + gait,16), Color("#27323b"), 8.0)
        draw_line(Vector2(9,-5), Vector2(11 - gait,16), Color("#27323b"), 8.0)
        draw_circle(Vector2(-facing*18,-30), 12.0, Color("#3e5263"))
        draw_arc(Vector2(-facing*18,-30), 12.0, 0, TAU, 16, Color("#a4b2bc"), 2.0)
        draw_line(Vector2(facing*16,-35), Vector2(facing*38,-18), glow, 5.0)
        draw_circle(Vector2(facing*43,-14), 5.0, Color("#f3b35b"))
    # Shared detail pass: faces, belts, armor seams, straps, and motion accents.
    if hero_class == "mage":
        draw_line(Vector2(-17,-42),Vector2(18,-42),Color("#71a6d2"),2.0)
        draw_line(Vector2(-14,-7),Vector2(14,-7),Color("#8aa8c4"),3.0)
        draw_circle(Vector2(facing*4,-56),1.6,Color("#19202b"))
        draw_line(Vector2(facing*15,-39+arm_swing*0.15),Vector2(facing*32,-58+arm_swing*0.22),Color("#d7c0a5"),4.0)
    elif hero_class == "rogue":
        draw_line(Vector2(-14,-17),Vector2(14,-17),Color("#80669e"),3.0)
        draw_line(Vector2(-12,-35),Vector2(12,-22),Color("#584c6c"),3.0)
        draw_circle(Vector2(facing*4,-54),1.7,Color("#16131d"))
        draw_line(Vector2(-facing*7,-4),Vector2(-facing*(12+arm_swing*0.25),12),Color("#353042"),5.0)
    elif hero_class == "paladin":
        var pal_detail: Color = Color("#fff0a0") if sacred_armor_time>0.0 else Color("#e1cc79")
        draw_line(Vector2(0,-39),Vector2(0,-14),pal_detail,3.0)
        draw_line(Vector2(-11,-27),Vector2(11,-27),pal_detail,3.0)
        draw_line(Vector2(-18,-43),Vector2(18,-43),Color("#f0e5c6"),2.0)
        draw_line(Vector2(-14,-7),Vector2(14,-7),Color("#8a826f"),4.0)
        draw_line(Vector2(-7,-61),Vector2(7,-61),Color("#5b6263"),2.0)
    elif hero_class == "archer":
        draw_line(Vector2(-13,-17),Vector2(13,-17),Color("#8e7654"),3.0)
        draw_line(Vector2(-15,-42),Vector2(13,-20),Color("#7f6b4f"),3.0)
        draw_circle(Vector2(facing*4,-56),1.6,Color("#1c221d"))
        draw_line(Vector2(-facing*13,-7),Vector2(-facing*(15+arm_swing*0.22),13),Color("#374438"),5.0)
    elif hero_class == "barbarian":
        draw_line(Vector2(-17,-19),Vector2(17,-19),Color("#9b704e"),4.0)
        draw_line(Vector2(-20,-43),Vector2(18,-24),Color("#7a5042"),4.0)
        draw_circle(Vector2(facing*5,-59),1.8,Color("#251719"))
        draw_line(Vector2(-facing*10,-7),Vector2(-facing*(14+arm_swing*0.18),13),Color("#47322d"),6.0)
    elif hero_class == "fighter":
        draw_line(Vector2(-15,-18),Vector2(15,-18),Color("#92724c"),4.0)
        draw_line(Vector2(-16,-43),Vector2(16,-43),Color("#87949c"),2.0)
        draw_circle(Vector2(facing*4,-52),1.7,Color("#1c2227"))
        draw_line(Vector2(-facing*11,-6),Vector2(-facing*(14+arm_swing*0.18),14),Color("#313b42"),6.0)
    elif hero_class == "monk":
        draw_line(Vector2(-13,-18),Vector2(13,-18),Color("#c39a61"),4.0)
        draw_line(Vector2(-14,-39),Vector2(14,-24),Color("#755a48"),3.0)
        draw_circle(Vector2(facing*4,-52),1.6,Color("#17211e"))
        draw_line(Vector2(-facing*9,-7),Vector2(-facing*(13+arm_swing*0.24),13),Color("#334742"),5.0)
    elif hero_class == "ranger":
        draw_line(Vector2(-14,-18),Vector2(14,-18),Color("#8c6f4b"),4.0)
        draw_line(Vector2(-16,-40),Vector2(16,-25),Color("#627257"),3.0)
        draw_circle(Vector2(facing*4,-53),1.6,Color("#182018"))
        draw_line(Vector2(-facing*9,-6),Vector2(-facing*(14+arm_swing*0.18),13),Color("#354337"),5.0)
    elif hero_class == "cleric":
        draw_line(Vector2(-15,-18),Vector2(15,-18),Color("#b69662"),4.0)
        draw_line(Vector2(-17,-41),Vector2(17,-41),Color("#cfd8dd"),2.0)
        draw_circle(Vector2(facing*4,-54),1.7,Color("#1a2228"))
        draw_line(Vector2(-facing*10,-6),Vector2(-facing*(14+arm_swing*0.16),13),Color("#46525e"),5.0)
    elif hero_class in ["bard","druid","sorcerer","warlock","wizard"]:
        draw_line(Vector2(-14,-18),Vector2(14,-18),Color("#a98761"),4.0)
        draw_circle(Vector2(facing*4,-55),1.7,Color("#171a20"))
        draw_line(Vector2(-facing*9,-6),Vector2(-facing*(14+arm_swing*0.18),13),Color("#31343d"),5.0)
    else:
        draw_line(Vector2(-14,-18),Vector2(14,-18),Color("#8c6f4d"),4.0)
        draw_line(Vector2(-18,-42),Vector2(18,-42),Color("#7890a0"),2.0)
        draw_circle(Vector2(facing*4,-51),1.7,Color("#1a2025"))
        draw_line(Vector2(facing*8,-34+arm_swing*0.20),Vector2(facing*20,-28+arm_swing*0.28),Color("#d8b99b"),4.0)

    if animation_state == "run" and run_amount > 0.35:
        var dust_alpha: float = 0.05+0.05*absf(gait_wave)
        draw_circle(Vector2(-facing*17,14),5.0,Color(0.67,0.71,0.73,dust_alpha))
        draw_circle(Vector2(-facing*27,11),3.0,Color(0.67,0.71,0.73,dust_alpha*0.75))
    if landing_visual_time > 0.0:
        var land_alpha: float = landing_visual_time/0.18
        draw_arc(Vector2(0,14),28.0,PI,TAU,18,Color(0.72,0.76,0.78,0.20*land_alpha),3.0)

    draw_set_transform(Vector2.ZERO,0.0,Vector2.ONE)

    if dash_time > 0.0:
        var dash_color: Color = Color(0.35,0.78,1.0,0.42) if hero_class == "mage" else Color(0.62,0.85,1.0,0.36)
        for i in range(4):
            draw_line(Vector2(-facing * (26.0 + i*12.0), -42.0 + i*8.0), Vector2(-facing * (72.0 + i*15.0), -42.0 + i*8.0), dash_color, 4.0)
    if ultimate_time > 0.0 and hero_class == "warrior":
        draw_arc(Vector2(0,-28),39.0,0,TAU,30,Color(1.0,0.73,0.24,0.64),3.0)

    if action_visual_time > 0.0:
        var action_alpha: float = clampf(action_visual_time/maxf(action_visual_total,0.001),0.0,1.0)
        if action_visual_kind.begins_with("warrior_"):
            var radius: float = 62.0 if "heavy" not in action_visual_kind else 82.0
            draw_arc(Vector2(facing*18,-30),radius,-1.0 if facing>0.0 else PI+0.15,0.55 if facing>0.0 else PI*1.85,18,Color(1.0,0.79,0.40,0.60*action_alpha),5.0)
        elif action_visual_kind.begins_with("mage_"):
            draw_arc(Vector2(facing*25,-48),22.0,0.0,TAU,20,Color(0.43,0.80,1.0,0.62*action_alpha),3.0)
            draw_arc(Vector2(facing*25,-48),31.0,0.0,TAU,20,Color(0.63,0.42,1.0,0.36*action_alpha),2.0)
        elif action_visual_kind.begins_with("rogue_"):
            draw_arc(Vector2(facing*10,-30),55.0,-0.9 if facing>0.0 else PI+0.25,0.65 if facing>0.0 else PI*1.8,16,Color(0.79,0.47,1.0,0.72*action_alpha),3.0)
            if "fan" in action_visual_kind:
                draw_arc(Vector2(0,-28),80.0,0.0,TAU,28,Color(0.72,0.39,1.0,0.38*action_alpha),3.0)
        elif action_visual_kind.begins_with("paladin_"):
            draw_arc(Vector2(facing*14,-31),66.0,-0.95 if facing>0.0 else PI+0.2,0.65 if facing>0.0 else PI*1.82,18,Color(1.0,0.88,0.42,0.72*action_alpha),4.0)
            if "nova" in action_visual_kind or "judgment" in action_visual_kind:
                draw_arc(Vector2(0,-28),92.0,0.0,TAU,30,Color(1.0,0.91,0.52,0.34*action_alpha),4.0)
        elif action_visual_kind.begins_with("archer_"):
            draw_line(Vector2(facing*18,-46),Vector2(facing*64,-46),Color(0.65,0.96,0.64,0.64*action_alpha),3.0)
            if "rain" in action_visual_kind or "ultimate" in action_visual_kind:
                draw_arc(Vector2(facing*45,-44),58.0,-1.0,1.0,20,Color(0.52,0.92,0.62,0.32*action_alpha),3.0)
        elif action_visual_kind.begins_with("barbarian_"):
            draw_arc(Vector2(facing*15,-28),78.0,-1.0 if facing>0.0 else PI+0.2,0.72 if facing>0.0 else PI*1.80,20,Color(1.0,0.42,0.25,0.72*action_alpha),6.0)
            if "slam" in action_visual_kind or "worldbreaker" in action_visual_kind:
                draw_arc(Vector2(0,7),112.0,PI,TAU,26,Color(1.0,0.38,0.20,0.42*action_alpha),5.0)
        elif action_visual_kind.begins_with("fighter_"):
            draw_arc(Vector2(facing*18,-31),82.0,-0.92 if facing>0.0 else PI+0.22,0.82 if facing>0.0 else PI*1.78,20,Color(0.96,0.78,0.40,0.70*action_alpha),5.0)
            if "parry" in action_visual_kind or "counter" in action_visual_kind:
                draw_arc(Vector2(-facing*18,-30),31.0,0.0,TAU,22,Color(1.0,0.86,0.52,0.55*action_alpha),4.0)
        elif action_visual_kind.begins_with("monk_"):
            draw_arc(Vector2(facing*13,-29),70.0,-0.88 if facing>0.0 else PI+0.24,0.78 if facing>0.0 else PI*1.76,22,Color(0.53,0.94,0.84,0.68*action_alpha),4.0)
            if "hundred" in action_visual_kind or "flurry" in action_visual_kind:
                draw_arc(Vector2(0,-31),47.0,0.0,TAU,26,Color(0.64,1.0,0.89,0.32*action_alpha),3.0)
        elif action_visual_kind.begins_with("ranger_"):
            draw_line(Vector2(facing*18,-45),Vector2(facing*70,-45),Color(0.76,0.94,0.48,0.62*action_alpha),3.0)
            if "predator" in action_visual_kind:
                draw_arc(Vector2(0,-34),46.0,0.0,TAU,26,Color(0.82,0.97,0.48,0.40*action_alpha),3.0)
        elif action_visual_kind.begins_with("cleric_"):
            draw_arc(Vector2(facing*24,-48),28.0,0.0,TAU,22,Color(0.78,0.90,1.0,0.66*action_alpha),3.0)
            if "intervention" in action_visual_kind or "rejuvenate" in action_visual_kind:
                draw_arc(Vector2(0,-31),52.0,0.0,TAU,28,Color(0.84,0.96,1.0,0.36*action_alpha),3.0)
        elif action_visual_kind.begins_with("bard_"):
            draw_arc(Vector2(0,-30),64.0,0.0,TAU,24,Color(0.93,0.55,0.78,0.42*action_alpha),3.0)
        elif action_visual_kind.begins_with("druid_"):
            draw_arc(Vector2(0,-28),70.0,PI,TAU,22,Color(0.45,0.82,0.48,0.48*action_alpha),4.0)
        elif action_visual_kind.begins_with("sorcerer_"):
            draw_arc(Vector2(aim_direction*28.0+Vector2(0,-32)),30.0,0.0,TAU,22,Color(1.0,0.55,0.36,0.58*action_alpha),3.0)
        elif action_visual_kind.begins_with("warlock_"):
            draw_arc(Vector2(aim_direction*24.0+Vector2(0,-32)),34.0,0.0,TAU,22,Color(0.66,0.38,0.88,0.58*action_alpha),3.0)
        elif action_visual_kind.begins_with("wizard_"):
            draw_arc(Vector2(aim_direction*28.0+Vector2(0,-34)),36.0,0.0,TAU,24,Color(0.63,0.55,1.0,0.60*action_alpha),3.0)
        elif action_visual_kind == "hurt":
            draw_circle(Vector2(0,-30),34.0,Color(1.0,0.25,0.30,0.12*action_alpha))

    if animation_state == "wall_slide":
        draw_line(Vector2(-facing*20,-54),Vector2(-facing*20,8),Color(0.75,0.86,0.92,0.22),3.0)

    var reticle: Vector2 = Vector2(0,-34)+aim_direction*76.0
    draw_arc(reticle,7.0,0.0,TAU,16,Color(0.92,0.90,0.82,0.62),1.5)
    draw_line(reticle-aim_direction.rotated(PI*0.5)*11.0,reticle-aim_direction.rotated(PI*0.5)*5.0,Color(0.92,0.90,0.82,0.62),1.5)
    draw_line(reticle+aim_direction.rotated(PI*0.5)*5.0,reticle+aim_direction.rotated(PI*0.5)*11.0,Color(0.92,0.90,0.82,0.62),1.5)
    if invulnerable > 0.0:
        draw_arc(Vector2(0,-28), 31.0, 0, TAU, 24, Color(0.7,0.9,1.0,0.42), 2.0)
