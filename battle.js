(function() {

const battle = modules.define('battle')
.import('audio')
.import('game')
.import('map_screen')
.import('image')
.import('util')
.import('title')
.export(function (defs) {
	// Battle screen
    var game = defs.game;
	
	// === SPELLS ==========================
	
	const makeSpell = function({name, cost, target, effect}) { return {
		name: name,
		target: target,
		effect: function(source, target) { effect(source, target); source.mp -= cost; },
		isPossible: function(source) { return source.mp >= cost; },
	};};
	
	const basicAttack = {
		name: "Attack",
		target: "enemy",
		effect: function(source, target) {
			target.hp -= source.dmg;
		}
	};
	
	const magicMissile = makeSpell({
		name: "Magic Missile",
		cost: 3,
		target: "enemy",
		effect: function(source, target) {
			target.hp -= 3;
		}
	});
	const firestorm = makeSpell({
		name: "Firestorm",
		cost: 7,
		target: "allEnemies",
		effect: function(source, target) {
			target.hp -= 4;
		}
	});
	const heal = makeSpell({
		name: "Heal",
		cost: 4,
		target: "ally",
		effect: function(source, target) {
			target.hp += 3;
		}
	});
	
	// === PARTY ===============================
	
	const ALLY_W = 32;
	const ALLY_H = 32;
	const ALLY_B = 16;
	const ALLY_X = 40;
	const ALLY_Y = 120;

	const makeAllyBasic = function({name, hp, mp, dmg, speed, spells, place}) { return {
		name: name,
		hp: hp,
		maxhp: hp,
		mp: mp,
		dmg: dmg,
		speed: speed,
		spells: spells,
		x: ALLY_X,
		y: ALLY_Y + place*(ALLY_H+ALLY_B),
		w: ALLY_W,
		h: ALLY_H,
		cd: speed*1000,
		exp: 0,
	};};
	
	const allies = [];

	const module = {};
	module.initialize_allies = function() {
		allies.length = 0;

		allies.push(makeAllyBasic({
			name: "Bobette",
			hp: 8,
			mp: 20,
			dmg: 3,
			speed: 1.0+(Math.PI/100),
			spells: [],
			place: 0,
		}));
		allies.push(makeAllyBasic({
			name: "Muscle Sorceress",
			hp: 11, 
			mp: 20,
			dmg: 2,
			speed: 1.1+(Math.PI/99),
			spells: [magicMissile, firestorm, heal],
			place: 1,
		}));
		allies.push(makeAllyBasic({
			name: "Carl",
			hp: 9,
			mp: 20,
			dmg: 3,
			speed: 1.2+(Math.PI/98),
			spells: [],
			place: 2,
		}));
		allies.push(makeAllyBasic({
			name: "Dave",
			hp: 11,
			mp: 20,
			dmg: 4,
			speed: 1.3+(Math.PI/97),
			spells: [],
			place: 3,
		}));
	};
	
	var mxg = 0;
	var myg = 0;
    const {audio,util} = defs;
        
    var Combatant = function(name, hp, dmg, speed) {
        this.name = name;
        this.hp = hp;
        this.dmg = dmg;
        this.speed = speed;
        this.cd = speed*1000;
    };
	
	/*
	Magic Properties:
	name: string
	cost: number
	getTarget: launches new ui (or picks a target at random)
	effect: function(target)
	*/
    
    Combatant.prototype.attack = function(target) {
        target.hp -= this.dmg;
    };
    
    Combatant.prototype.die = function(isAlly) {
        this.hp = 0;
    }

	module.allies = allies;

	module.initUi = function (map_ui, floor_number) {
		mxg = myg = 0;

		audio.playMusic('battle');
		
		const enemies = [];
		
		let buttons = [];
		let spellButtons = [];
		let targetButtons = [];
		
		const BUTTON_X = 40;
		const BUTTON_Y = game.HEIGHT-40;
		const BUTTON_W = 160;
		const BUTTON_H = 30;
		const BUTTON_B = 6;
		
		const ENEMY_W = 32;
		const ENEMY_H = 32;
		const ENEMY_B = 16;
		const ENEMY_X = game.WIDTH-40-ENEMY_W;
		const ENEMY_Y = 120;
		
		
		// === MAKER FUNCTIONS ==================================

		// Columns: 4 total, index 0 is LEFT
		// Rows: 5 total, index 0 is BOTTOM
		var makeButtonGrid = function({name, col, row, f2, f1, f0, alwaysDraw, 
									   activate, deactivate, enabled, allowed, selected}) { return {
			name: name,
			x: BUTTON_X + col*(BUTTON_W+BUTTON_B),
			y: BUTTON_Y - row*(BUTTON_H+BUTTON_B),
			w: BUTTON_W,
			h: BUTTON_H,
			f2: f2,
			f1: f1,
			f0: f0,
			alwaysDraw: alwaysDraw,
			activate: function() { this.active = true; activate(); },
			deactivate: function() { this.active = false; deactivate(); },
			enabled: enabled,
			allowed: allowed,
			selected: selected,
		};};
		
		var makeButtonPrecise = function({name, x, y, w, h, f2, f1, f0, 
										  activate, deactivate, enabled, allowed, selected}) { return {
			name: name,
			x: x,
			y: y,
			w: w,
			h: h,
			f2: f2,
			f1: f1,
			f0: f0,
			activate: function() { this.active = true; activate(); },
			deactivate: function() { this.active = false; deactivate(); },
			enabled: enabled,
			allowed: allowed,
			selected: selected,
		};};
		
		var makeSpellButtons = function(active) {
			for (let i=0; i<active.spells.length; i++) {
				spell = active.spells[i];
				spellButtons.push(makeButtonGrid({
					name: spell.name,
					col: 1,
					row: 1+i,
					f2: "#00f",
					f1: "#99f",
					f0: "#999",
					alwaysDraw: false,
					activate: function() {
						switch (spell.target) {
						case "enemy":
							makeTargetButtons(enemies, spell, active);
							break;
						case "ally":
							makeTargetButtons(allies, spell, active);
							break;
						case "allEnemies":
							for (let e of enemies) { spell.effect(active, e); }
							returnToCombat();
							break;
						case "allAllies":
							for (let e of allies) { spell.effect(active, e); }
							returnToCombat();
							break;
						default:
							returnToCombat();
							break;
						}
					},
					deactivate: function() {
						
					},
					enabled: false,
					allowed: false,
					selected: false,
				}));
			}
		};
		
		var makeTargetButtons = function(targets, spell, active) {
			targetButtons = [];
			for (let target of targets) {
				if (target.hp <= 0) continue;
				let {x, y, w, h} = target;
				let t = target;
				targetButtons.push(makeButtonPrecise({
					name: "",
					x: x,
					y: y,
					w: w,
					h: h,
					f2: "rgba(255,0,0,0.5)",
					f1: "rgba(255,0,0,0.2)",
					f0: "rgba(255,0,0,0.5)",
					activate: function() {
						spell.effect(active, t);
						returnToCombat();
					},
					deactivate: { },
					enabled: true,
					allowed: true,
					selected: false,
				}));
			}
		}
		
		var makeEnemyBasic = function({name, hp, dmg, speed, actions, place, pictureName}) { return {
			name: name,
			hp: hp,
			dmg: dmg,
			speed: speed,
			actions: actions,
			x: ENEMY_X,
			y: ENEMY_Y + place*(ENEMY_H+ENEMY_B),
			w: ENEMY_W,
			h: ENEMY_H,
			cd: speed*1000,
			pictureName: pictureName,
		};};
	
		// === MENU BUTTONS ==================================
		
		var attackButton = makeButtonGrid({
			name: "ATTACK",
			col: 0,
			row: 0,
			f2: "#f00",
			f1: "#f99",
			f0: "#999",
			alwaysDraw: true,
			activate: function() {
				
			},
			deactivate: function() {
				
			},
			enabled: true,
			allowed: true,
			selected: false,
		});
		
		var spellsButton = makeButtonGrid({
			name: "SPELLS",
			col: 1,
			row: 0,
			f2: "#00f",
			f1: "#99f",
			f0: "#999",
			alwaysDraw: true,
			activate: function() {
				
			},
			deactivate: function() {
				
			},
			enabled: true,
			allowed: true,
			selected: false,
		});
		

		// === SPELLS =======================================
		
		// Not actually a spell, but similarly formatted.
		
		
		
		// === ENEMY AI ==============================
		
		let enemyAct = function(enemy) {
			let action = enemy.actions[Math.floor(Math.random()*enemy.actions.length)];
			({
				enemy: () => {
					let t = allies[Math.floor(Math.random()*allies.length)];
					while (t.hp <= 0) t = allies[Math.floor(Math.random()*allies.length)];
					action.effect(enemy, t);
				},
				ally:  () => {
					let t = enemies[Math.floor(Math.random()*enemies.length)];
					while (t.hp <= 0) t = enemies[Math.floor(Math.random()*enemies.length)];
					action.effect(enemy, t);
				},
				allEnemies:  () => {
					for (let t of allies) {
						action.effect(enemy, t);
					}
				},
				allAllies:  () => {
					for (let t of enemies) {
						action.effect(enemy, t);
					}
				},
			})[action.target]();
		}
		
		// === ENEMIES ================================
		{
			const m = floor_number;  // bonus stats modifier

			enemies.push(makeEnemyBasic({
				name: "Wolf",
				hp: 7+m*3,
				dmg: 5+m,
				speed: 1.2+(Math.PI/96),
				actions: [basicAttack],
				place: 0,
				pictureName: "char/wolf.png",
			}));
			enemies.push(makeEnemyBasic({
				name: "Lobster",
				hp: 8+m*2,
				dmg: 4+m,
				speed: 1.5+(Math.PI/95),
				actions: [basicAttack],
				place: 1,
				pictureName: "char/lobster.png",
			}));
			enemies.push(makeEnemyBasic({
				name: "Evil Tree",
				hp: 7+m*2,
				dmg: 6+m,
				speed: 2.0+(Math.PI/94),
				actions: [heal],
				place: 2,
				pictureName: "char/tree.png",
			}));
		}
		
		// === THE REST OF IT ==================================
		
		var overButton = function(button) {
			let result = ((mxg > button.x) && (mxg < button.x+button.w) &&
					(myg > button.y) && (myg < button.y+button.h));
			return result;
		}
		
		var overAlly = function() {
			return overIcon(mxg, myg, allyIcons);
		}
		
		var overEnemy = function() {
			return overIcon(mxg, myg, enemyIcons);
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
				var txtw = ctx.measureText(txt).width;
                ctx.fillText(txt, 20, 22*(i+1));

				const {x, y} = a;

				// Draw sprite
				defs.image.drawImage(ctx, 'char/hero.png', x, y);

				// Display current cooldown timer
                ctx.font = "bold 14pt sans-serif";
                ctx.fillStyle = "#444";
                ctx.fillText((a.cd/1000).toFixed(1), txtw+26, 22*(i+1));
			}
        };
        
        var drawEnemies = function(ctx) {
            ctx.textAlign = "right";
            for (var i=0; i<enemies.length; i++) {
                var e = enemies[i];
				
				// Draw name and HP
                ctx.font = "bold 18pt sans-serif";
                ctx.fillStyle = "#f00";
                if (e.hp <= 0) ctx.fillStyle = "#888";
                var txt = e.name + " " + e.hp;
				var txtw = ctx.measureText(txt).width;
                ctx.fillText(txt, game.WIDTH-20, 22*(i+1));
				
				const {x, y} = e;
				
				// Draw sprite
				if (e.hp > 0)
					defs.image.drawImage(ctx, e.pictureName, x, y);
				
				// Display current cooldown timer
                ctx.font = "bold 14pt sans-serif";
                ctx.fillStyle = "#444";
                ctx.fillText((e.cd/1000).toFixed(1), game.WIDTH-txtw-30, 22*(i+1));
            }
        };
		
		var drawMenu = function(ctx, attacker) {
			drawButton(ctx, attackButton);
			drawButton(ctx, spellsButton);
		};
		
		var hasSpells = function(combatant) {
			return combatant.spells && combatant.spells.length > 0;
		};
		
		var drawSpellsMenu = function(ctx, active) {
			drawButton(ctx, spellsButton);
			if (spellsButton.enabled) {
				for (let i=0; i<active.spells.length; i++) {
					drawSpellButton(ctx, i, spellButtons[i], active);
				}
			}
		};
		
		var drawTargets = function(ctx, active) {
			for (let target of targetButtons) {
				drawButton(ctx, target);
			}
		};
		
		var drawButton = function(ctx, button) {
			let {x, y, w, h, f0, f1, f2, name, enabled, selected, allowed} = button;
			if (!allowed) ctx.fillStyle = f0;
			else ctx.fillStyle = (overButton(button) || selected ? f2 : f1);
			if (enabled) {
				ctx.fillRect(x, y, w, h);
				ctx.font = "bold 18pt sans-serif";
				ctx.fillStyle = "#000";
				ctx.textAlign = "center";
				ctx.fillText(name, x+(w/2), y+24);
			}
		}
		
		var drawSpellButton = function(ctx, i, button, active) {
			const {x, y, w, h, f0, f1, f2, name, enabled, selected} = button;
			if (enabled) {
				ctx.fillStyle = (overButton(button) || selected ? f2 : f1);
				ctx.fillRect(x, y, w, h);
				ctx.font = "bold 18pt sans-serif";
				ctx.fillStyle = "#000";
				ctx.textAlign = "center";
				ctx.fillText(active.spells[i].name, x+(w/2), y+24);
			}
			
		}
		
		var tickCooldowns = function(elapsed) {
			for (var i=0; i<allies.length; i++) {
				if (allies[i].hp > 0) {
					allies[i].cd -= elapsed;
					if (allies[i].cd < 0) refundCooldowns(-allies[i].cd);
				}
			}
			for (var i=0; i<enemies.length; i++) {
				if (enemies[i].hp > 0) {
					enemies[i].cd -= elapsed;
					if (enemies[i].cd < 0) refundCooldowns(-enemies[i].cd);
				}
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
				return;
			}
			for (var i=0; i<allies.length; i++) {
				var a = allies[i];
				if (a.cd <= 0 && !enemiesDead()) {
					initMenu(a); // TODO MAKE THIS NOT BAD
					a.cd += a.speed*1000;
				}
			}
		};

        var tickEnemies = function(elapsed) {
			if (alliesDead()) {
				game.ui = defeat_ui;
				return;
			}
            for (var i=0; i<enemies.length; i++) {
                var e = enemies[i];
                if (e.cd <= 0) {
                    if (!alliesDead()) {
                        enemyAct(e);
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
				// Level-up
				for(let a of allies) {
					// TODO: What if the ally is dead?

					const bonus_hp_0 = Math.floor(Math.sqrt(a.exp) + a.maxhp);
					const base_hp    = a.maxhp - bonus_hp_0;
					let   bonus_d_0  = Math.floor(Math.sqrt(a.exp)/2 + 3);
					const base_d     = a.dmg - bonus_d_0;

					a.exp += floor_number+1;
					
					const bonus_hp_1 = Math.floor(Math.sqrt(a.exp) + a.maxhp);
					const bonus_d_1  = Math.floor(Math.sqrt(a.exp)/2 + 3);
					const healing = bonus_hp_1 - bonus_hp_0;
					a.hp += healing;
					a.maxhp = base_hp + bonus_hp_1;
					a.dmg = base_d + bonus_d_1;
				}

                game.ui = map_ui;
				audio.playMusic('dungeon');
			},
		};

		const on_attack_button_clicked = function(active) {
			spellsButton.selected = false;
			for (let b of spellButtons) {
				b.enabled = false;
				b.selected = false;
			}
			attackButton.selected = !attackButton.selected;
			if (attackButton.selected) {
				makeTargetButtons(enemies, basicAttack, active);
			}
			else targetButtons = [];
		};

		var initMenu = function(active) {
			attackButton.selected = false;
			spellsButton.selected = false;
			spellButtons = [];
			targetButtons = [];
			
			makeSpellButtons(active);
			for (let i=0; i<spellButtons.length; i++) {
				spellButtons[i].allowed = (active.mp >= active.spells[i].cost);
			}
			spellsButton.allowed = active.spells.length > 0;

			game.ui = menu_ui(active);
			on_attack_button_clicked(active);  // Such a hack
		};
		
		var returnToCombat = function() {
			game.ui = ui;
		};
		
		var defeat_ui = {
			draw: function (ctx) {
				drawStandard(ctx);
				drawEnd(ctx, false);
			},
            mouse_clicked: function({mx,my}) {
                game.ui = defs.title.initUi();
				audio.playMusic('dungeon');
			},
		};

		// MAIN MENU UI
		var menu_ui = function(active) { return {
			draw: function (ctx) {
				drawStandard(ctx);
				drawMenu(ctx, active);
				drawSpellsMenu(ctx, active);
				drawTargets(ctx, active);
			},
            mouse_clicked: function({mx,my}) {
                if (overButton(attackButton)) {
					on_attack_button_clicked(active);
				}
				if (overButton(spellsButton)) {
					attackButton.selected = false;
					spellsButton.selected = !spellsButton.selected;
					for (let b of spellButtons) {
						b.enabled = spellsButton.selected;
					}
				}
				for (let spellButton of spellButtons) {
					if (overButton(spellButton)) {
						let {active, allowed, activate} = spellButton;
						if (allowed) {
							for (let sb of spellButtons) sb.allowed = false;
						}
					}
				}
				for (let targetButton of targetButtons) {
					if (overButton(targetButton)) {
						let {active, allowed, activate} = targetButton;
						if (allowed) {
							activate();
							returnToCombat();
						}
					}
				}
			},
			mouse_moved: function({mx,my}) {
				mxg = mx;
				myg = my;
			},
		};};
        
		var ui = {
			draw: function (ctx) {
				drawStandard(ctx);
			},
			tick: function (elapsed) {
				tickCooldowns(elapsed);
				tickAllies(elapsed);
				tickEnemies(elapsed);
			},
			mouse_moved: function({mx,my}) {
				mxg = mx;
				myg = my;
			},
		};
		return ui;
	};
	
	return module;
});

}());
