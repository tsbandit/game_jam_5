(function() {

const battle = modules.define('battle')
.import('game')
.import('map_screen')
.import('image')
.export(function (defs) {
	// Battle screen
    var game = defs.game;
    
	var module = {};
    
    var Combatant = function(name, hp, dmg, speed) {
        this.name = name;
        this.hp = hp;
        this.dmg = dmg;
        this.speed = speed;
        this.cd = speed*1000;
    };
    
    Combatant.prototype.attack = function(target) {
        target.hp -= this.dmg;
    };
    
    Combatant.prototype.die = function(isAlly) {
        this.hp = 0;
    }
    
    var allies;
    var enemies;
	var active;
	var attackButton = {
		x: 40,
		y: game.HEIGHT-40,
		w: 160,
		h: 60,
		fill: "#f99",
	}
	var enemyIcons = {
		x: game.WIDTH-80,
		ys: 120,
		yi: 50,
		w: 32,
		h: 32,
		over: -1,
	}
	var allyIcons = {
		x: 40,
		ys: 120,
		yi: 50,
		w: 32,
		h: 32,
	}
	
	module.initUi = function (map_ui) {
		
		allies = [];
		enemies = [];
		
		// Set these after game dimensions have been set
		attackButton.y = game.HEIGHT-40;
		enemyIcons.x = game.WIDTH-80;
        
        allies.push(new Combatant("Bobette", 10, 3, 2.0));
        allies.push(new Combatant("Muscle Sorceress", 8, 3, 3.6));
        allies.push(new Combatant("Carl", 9, 3, 1.4));
        
        enemies.push(new Combatant("Foo", 3, 2, 2.7));
        enemies.push(new Combatant("Bar", 4, 2, 2.5));
        enemies.push(new Combatant("Baz", 5, 2, 2.2));
		
		var overButton = function(mx, my, button) {
			return ((mx > button.x) && (mx < button.x+button.w) &&
					(my > button.y) && (my < button.y+button.h));
		}
		
		var overAlly = function(mx, my) {
			return overIcon(mx, my, allyIcons);
		}
		
		var overEnemy = function(mx, my) {
			return overIcon(mx, my, enemyIcons);
		}
		
		var overIcon = function(mx, my, t) {
			for (i=0; i<enemies.length; i++) {
				var y = t.ys+(i*t.yi);
				if ((mx > t.x) && (mx < t.x+t.w) &&
					(my > y) && (my < y+t.h)) return i;
			}
			return -1;
		};
        
        var drawAllies = function(ctx) {
            ctx.textAlign = "left";
            for (var i=0; i<allies.length; i++) {
                var a = allies[i];

				// Draw name and HP
                ctx.font = "bold 18pt sans-serif";
                ctx.fillStyle = "#0f0";
                if (a.hp <= 0) ctx.fillStyle = "#888";
				var txt = a.name + " " + a.hp;
                ctx.fillText(txt, 20, 22*(i+1));

				let {x, y, w, h} = allyIcons;
				y = allyIcons.ys+i*allyIcons.yi;

				// Highlight if active turn
				if (active == allies[i]) {
					ctx.fillStyle = "#0f0";
					ctx.fillRect(x, y, w, h);
				}

				// Draw sprite
				defs.image.drawImage(ctx, 'Game Jam Art/Blue Hair Sprite finish.png', x, y);

				// Display current cooldown timer
                ctx.font = "bold 14pt sans-serif";
                ctx.fillStyle = "#444";
                ctx.fillText((a.cd/1000).toFixed(1), ctx.measureText(txt).width+44, 22*(i+1));
			}
        };
        
        var drawEnemies = function(ctx) {
            ctx.textAlign = "right";
            for (var i=0; i<enemies.length; i++) {
                var e = enemies[i];
                ctx.font = "bold 18pt sans-serif";
                ctx.fillStyle = "#f00";
                if (e.hp <= 0) ctx.fillStyle = "#888";
                var txt = e.name + " " + e.hp;
                ctx.fillText(txt, game.WIDTH-20, 22*(i+1));
				
				// Temporary Sprites
				if (enemyIcons.over == i) {
					ctx.fillStyle = "#f00";
				}
                else {
					ctx.fillStyle = "#f99";
				}
				ctx.fillRect(enemyIcons.x, enemyIcons.ys+(i*enemyIcons.yi), enemyIcons.w, enemyIcons.h);
				
                ctx.font = "bold 14pt sans-serif";
                ctx.fillStyle = "#444";
                ctx.fillText((e.cd/1000).toFixed(1), game.WIDTH-ctx.measureText(txt).width-44, 22*(i+1));
            }
        };
		
		var drawMenu = function(ctx, attacker) {
			ctx.fillStyle = attackButton.fill;
			var b = attackButton;
			ctx.fillRect(b.x, b.y, b.w, b.h);
			ctx.font = "bold 20pt sans-serif";
			ctx.fillStyle = "#000";
			ctx.textAlign = "center";
			ctx.fillText("ATTACK", b.x+(b.w/2), b.y+26);
		};
		
		var tickCooldowns = function(elapsed) {
			for (var i=0; i<allies.length; i++) {
				allies[i].cd -= elapsed;
				if (allies[i].cd < 0) refundCooldowns(-allies[i].cd);
			}
			for (var i=0; i<enemies.length; i++) {
				enemies[i].cd -= elapsed;
				if (enemies[i].cd < 0) refundCooldowns(-enemies[i].cd);
			}
		};
		
		var refundCooldowns = function(n) {
			for (var i=0; i<allies.length; i++) {
				allies[i].cd += n;
			}
			for (var i=0; i<enemies.length; i++) {
				enemies[i].cd += n;
			}
		};
				
		var drawStandard = function(ctx) {
			drawAllies(ctx);
			drawEnemies(ctx);
		};
		
		var drawEnd = function(ctx, victory) {
			ctx.font = "bold 24pt sans-serif";
			ctx.fillStyle = "#000";
			ctx.textAlign = "center";
			ctx.fillText("YOU " + (victory ? "WIN" : "LOSE"), game.WIDTH/2, game.HEIGHT/5);
			ctx.font = "bold 16pt sans-serif";
			ctx.fillText('Click to continue.', game.WIDTH/2, game.HEIGHT/5+30);
		};
        
		var tickAllies = function(elapsed) {
			if (enemiesDead()) {
				game.ui = victory_ui;
			}
			for (var i=0; i<allies.length; i++) {
				var a = allies[i];
				if (a.cd <= 0) {
					
					// Menu UI
					active = a;
					game.ui = menu_ui;
				}
			}
		};

        var tickEnemies = function(elapsed) {
            for (var i=0; i<enemies.length; i++) {
                var e = enemies[i];
                if (e.cd <= 0) {
                    if (!alliesDead()) {
                        var t = allies[Math.floor(Math.random()*allies.length)];
                        while (t.hp <= 0) t = allies[Math.floor(Math.random()*allies.length)];
                        e.attack(t);
                        if (t.hp <= 0) {
                            t.die(true);
                        }
                        e.cd += e.speed*1000;
                    }
                }
            }
        };
        
        var alliesDead = function() {
            for (var i=0; i<allies.length; i++) {
                if (allies[i].hp > 0) return false;
            }
            return true;
        };
		
		var enemiesDead = function() {
            for (var i=0; i<enemies.length; i++) {
                if (enemies[i].hp > 0) return false;
            }
            return true;
        };
		
		var victory_ui = {
			draw: function (ctx) {
				drawStandard(ctx);
				drawEnd(ctx, true);
			},
            mouse_clicked: function({mx,my}) {
                game.ui = defs.map_screen.initUi();
			},
		};
		
		var defeat_ui = {
			draw: function (ctx) {
				drawStandard(ctx);
				drawEnd(ctx, false);
			},
            mouse_clicked: function({mx,my}) {
                game.ui = defs.map_screen.initUi();
			},
		};
		
		// MAIN MENU UI
		var menu_ui = {
			draw: function (ctx) {
				drawStandard(ctx);
				drawMenu(ctx);
			},
            mouse_clicked: function({mx,my}) {
                if (overButton(mx,my,attackButton)) {
					game.ui = target_ui;
				}
			},
			mouse_moved: function({mx,my}) {
				if (overButton(mx,my,attackButton)) attackButton.fill = "#f00";
				else attackButton.fill = "#f99";
			},
		};
		
		var target_ui = {
			draw: function (ctx) {
				drawStandard(ctx);
				drawMenu(ctx);
			},
            mouse_clicked: function({mx,my}) {
                var t = overEnemy(mx, my);
				if (t > -1) {
					active.attack(enemies[t]);
					active.cd += active.speed*1000;
					game.ui = ui;
					enemyIcons.over = -1;
				}
			},
			mouse_moved: function({mx,my}) {
				enemyIcons.over = overEnemy(mx,my);
			},
		};
        
		var ui = {
			draw: function (ctx) {
				drawStandard(ctx);
			},
			tick: function (elapsed) {
				tickCooldowns(elapsed);
				tickAllies(elapsed);
				tickEnemies(elapsed);
			},
            mouse_clicked: function(ev) {
                if (alliesDead()) {
					game.ui = map_ui;
				}
			},
		};
		return ui;
	};
	
	return module;
});

}());
