extends Node2D

var player: Hero
var info_label: Label
var class_label: Label
var audio: AudioDirector
var start_position: Vector2 = Vector2(180,560)

func _ready() -> void:
    audio = AudioDirector.new()
    add_child(audio)
    audio.set_music("fallen_village_theme",0.35,true)
    _build_world()
    _spawn_player()
    _build_hud()
    queue_redraw()

func _build_world() -> void:
    _platform(Vector2(900,650),Vector2(1800,140),Color("#202a31"))
    _platform(Vector2(430,520),Vector2(220,34))
    _platform(Vector2(710,430),Vector2(180,34))
    _platform(Vector2(1030,500),Vector2(220,34))
    _platform(Vector2(1320,390),Vector2(180,34))
    _platform(Vector2(1500,470),Vector2(120,34))
    _platform(Vector2(900,420),Vector2(34,390),Color("#303a44"))

func _platform(center: Vector2, size: Vector2, color: Color = Color("#27323b")) -> void:
    add_child(StonePlatform.new().setup(center,size,color))

func _spawn_player() -> void:
    player = Hero.new()
    player.global_position = start_position
    add_child(player)
    player.configure_class("warrior")
    player.sfx_requested.connect(_play_sfx)
    var camera: Camera2D = Camera2D.new()
    camera.position = Vector2(100,-80)
    camera.position_smoothing_enabled = true
    camera.position_smoothing_speed = 7.0
    camera.limit_left = 0
    camera.limit_right = 1800
    camera.limit_top = -80
    camera.limit_bottom = 720
    player.add_child(camera)

func _build_hud() -> void:
    var layer: CanvasLayer = CanvasLayer.new()
    layer.layer = 20
    add_child(layer)
    var panel: ColorRect = ColorRect.new()
    panel.position = Vector2(18,18)
    panel.size = Vector2(430,112)
    panel.color = Color(0.02,0.025,0.035,0.82)
    layer.add_child(panel)

    class_label = Label.new()
    class_label.position = Vector2(34,30)
    class_label.size = Vector2(390,28)
    class_label.text = "MOVEMENT LAB  //  WARRIOR"
    class_label.add_theme_font_size_override("font_size",18)
    class_label.add_theme_color_override("font_color",Color("#f0c67a"))
    layer.add_child(class_label)

    info_label = Label.new()
    info_label.position = Vector2(34,62)
    info_label.size = Vector2(395,60)
    info_label.add_theme_font_size_override("font_size",13)
    info_label.add_theme_color_override("font_color",Color("#d6dde2"))
    layer.add_child(info_label)

    var controls: Label = Label.new()
    controls.position = Vector2(470,18)
    controls.size = Vector2(780,102)
    controls.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
    controls.text = "1–0 FIRST TEN CHAMPIONS   F1 BARD   F2 DRUID   F3 SORCERER   F4 WARLOCK   F5 WIZARD\nA/D MOVE   W/E JUMP   S/Q CROUCH   SHIFT/X DASH\nSPACE/J/LMB ATTACK   K/RMB HEAVY   L/I ABILITIES   U ULTIMATE\nF INTERACT   ` CONSOLE   R RESET   ESC RETURN"
    controls.add_theme_font_size_override("font_size",11)
    controls.add_theme_color_override("font_color",Color(0.78,0.81,0.85,0.82))
    layer.add_child(controls)

func _process(_delta: float) -> void:
    if not is_instance_valid(player):
        return
    info_label.text = "SPEED %4d    VY %4d    STATE %s\nGROUND %s    WALL %s    AIR JUMPS %d" % [
        int(round(player.velocity.x)),
        int(round(player.velocity.y)),
        player.animation_state.to_upper(),
        "YES" if player.is_on_floor() else "NO",
        "YES" if player.is_on_wall_only() else "NO",
        player.air_jumps_remaining
    ]
    info_label.text += "   CROUCH %s   AIM %d°" % ["YES" if player.crouching else "NO",int(round(rad_to_deg(player.aim_direction.angle())))]

func _unhandled_input(event: InputEvent) -> void:
    if event is InputEventKey and event.pressed and not event.echo:
        var key: int = event.physical_keycode
        if key == KEY_1:
            _switch_class("warrior")
        elif key == KEY_2:
            _switch_class("mage")
        elif key == KEY_3:
            _switch_class("rogue")
        elif key == KEY_4:
            _switch_class("paladin")
        elif key == KEY_5:
            _switch_class("archer")
        elif key == KEY_6:
            _switch_class("barbarian")
        elif key == KEY_7:
            _switch_class("fighter")
        elif key == KEY_8:
            _switch_class("monk")
        elif key == KEY_9:
            _switch_class("ranger")
        elif key == KEY_0:
            _switch_class("cleric")
        elif key == KEY_F1:
            _switch_class("bard")
        elif key == KEY_F2:
            _switch_class("druid")
        elif key == KEY_F3:
            _switch_class("sorcerer")
        elif key == KEY_F4:
            _switch_class("warlock")
        elif key == KEY_F5:
            _switch_class("wizard")
        elif key == KEY_R:
            player.reset_at(start_position)
        elif key == KEY_ESCAPE:
            get_tree().change_scene_to_file("res://scenes/Main.tscn")
            get_viewport().set_input_as_handled()

func _switch_class(class_id: String) -> void:
    player.configure_class(class_id)
    player.reset_at(start_position)
    class_label.text = "MOVEMENT LAB  //  %s" % player.display_name
    var class_color: Color = Color("#f0c67a")
    if class_id == "mage":
        class_color = Color("#79cfff")
    elif class_id == "rogue":
        class_color = Color("#c48cff")
    elif class_id == "paladin":
        class_color = Color("#f1dc82")
    elif class_id == "archer":
        class_color = Color("#7fe0a7")
    elif class_id == "barbarian":
        class_color = Color("#e77d5b")
    elif class_id == "fighter":
        class_color = Color("#e4bd73")
    elif class_id == "monk":
        class_color = Color("#7fe2cf")
    elif class_id == "ranger":
        class_color = Color("#91d16f")
    elif class_id == "cleric":
        class_color = Color("#b9dcef")
    elif class_id == "bard": class_color=Color("#e88fc8")
    elif class_id == "druid": class_color=Color("#75c77c")
    elif class_id == "sorcerer": class_color=Color("#ff8b6b")
    elif class_id == "warlock": class_color=Color("#a26bd8")
    elif class_id == "wizard": class_color=Color("#9d8cff")
    class_label.add_theme_color_override("font_color",class_color)

func _draw() -> void:
    draw_rect(Rect2(0,0,1800,720),Color("#111722"))
    for x in range(80,1760,120):
        draw_line(Vector2(x,120),Vector2(x,600),Color(0.32,0.42,0.52,0.08),1.0)
    for y in range(120,620,80):
        draw_line(Vector2(40,y),Vector2(1760,y),Color(0.32,0.42,0.52,0.08),1.0)

func _play_sfx(id: String, volume_db: float, pitch: float) -> void:
    if is_instance_valid(audio):
        audio.play_sfx(id,volume_db,pitch)
