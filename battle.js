(function() {

const battle = modules.define('battle')
.import('audio')
.import('game')
.import('map_screen')
.import('image')
.import('util')
.import('title')
.import('input')
.export(function (defs) {
    const {audio,util,game,image,input} = defs;

	// === ANIMATIONS ==========================

	const stand_anim = function(a) {return {
		tick() {},
		draw(ctx) {
			image.drawImage(ctx, a.pictureName, a.x, a.y);
		},
	};};

	const lerp_anim = function(a, sx, sy, dx, dy, time, next) {
		const result = {
			tick(elapsed) {
				if(time <= 0) {
					next.tick(elapsed);
					return;
				}

				const new_time = time - elapsed;
				const r = new_time / time;
				sx = r*sx + (1-r)*dx;
				sy = r*sy + (1-r)*dy;
				time = new_time;

				if(time < 0)
					result.tick(-time);
			},
			draw(ctx) {
				if(time <= 0)
					next.draw(ctx);
				else
					image.drawImage(ctx, a.pictureName, sx, sy)
			},
		};
		return result;
	};

	// === SPELLS ==========================
	
	const makeSpell = function({name, cost, target, effect, info}) { return {
		name: name,
		target: target,
		effect: function(source, target) {
			util.assert(this.isPossible(source));
			source.mp -= cost;
			effect(source, target);
		},
		isPossible: function(source) { return source.mp >= cost; },
		info(source, target) {
			return [
				'Reduce ' + source.name + "'s MP by " + cost,
				...info(source, target),
			];
		},
	};};

	const basicAttack = {
		name: "Attack",
		target: "enemy",
		info(source, target) {
			return [
				"Reduce target's HP by " + source.dmg,
			];
		},
		isPossible() {return true;},
		effect: function(source, target) {
			target.hp -= source.dmg;

			// Animation
			const {x: sx, y: sy} = source;
			const {x: dx, y: dy} = target;
			const dx1 = 1.06*dx - 0.06*sx;
			const dy1 = 1.06*dy - 0.06*sy;
			const dx2 = 1.03*dx - 0.03*sx;
			const dy2 = 1.03*dy - 0.03*sy;
			source.anim = lerp_anim(source, sx, sy, dx, dy, 100,
			              lerp_anim(source, dx, dy, sx, sy, 500,
			              stand_anim(source) ));
			target.anim = lerp_anim(target, dx,  dy,  dx,  dy,  100,
			              lerp_anim(target, dx,  dy,  dx1, dy1, 125,
			              lerp_anim(target, dx1, dy1, dx,  dy,  125,
			              lerp_anim(target, dx,  dy,  dx2, dy2, 125,
			              lerp_anim(target, dx2, dy2, dx,  dy,  125,
			              stand_anim(target) )))));
		}
	};
	const wait = {
		name: 'Wait',
		target: 'none',  //???
		info(source, target) {
			return [
				'Skip a turn',
			];
		},
		isPossible() {return true;},
		effect() {},
	};
	
	const heal_ability = {
		name: "Heal",
		target: "ally",
		isPossible(source) {return true;},
		effect: function(source, target) {
			heal(target, Math.floor(source.dmg * 1.6));
		},
	};
	const magicMissile = makeSpell({
		name: "Magic Missile",
		cost: 3,
		target: "enemy",
		effect: function(source, target) {
			target.hp -= 3;
		},
	});
	const firestorm = makeSpell({
		name: "Firestorm",
		cost: 7,
		target: "allEnemies",
		effect: function(source, targets) {
			for(let t of targets)
				t.hp -= 4;
		}
	});
	const heal = function(c, amount) {
		c.hp += amount;
		if(c.hp > c.maxhp)
			c.hp = c.maxhp;
	};
	const use_potion = function() {
		const amount = 20;

		return {
			name: 'Potion (' + battle.player_data.inventory.potion + ' available)',
			target: 'ally',
			isPossible(source) {
				util.assert(allies.indexOf(source) >= 0);
				return battle.player_data.inventory.potion >= 1;
			},
			effect(source, target) {
				battle.player_data.inventory.potion -= 1;
				heal(target, amount);
			},
			info(source, target) {
				return [
					'Consume 1 potion',
					"Increase target's HP by " + amount,
				];
			},
		};
	};

	const random_sword = function() {
		const amount = 2;

		return {
			type: 'weapon',
			name: 'Random sword',
			spell: {
				name: 'Random sword',
				target: 'enemy',
				isPossible: () => true,
				effect(source, target) {
					let dmg = 1;

					while(Math.random() >= 1/amount/source.dmg)
						++dmg;

					target.hp -= dmg;
				},
				info(source, target) {
					return [
						"Reduce target's HP by random amount",
						"    (average: " + (amount*source.dmg) + ")",
					];
				},
			},
		};
	};
	const painful_sword = function() {
		const cost = source => Math.floor(source.maxhp*.1 + 0.5);
		const power = 3;
		return {
			type: 'weapon',
			name: 'Painful sword',
			spell: {
				name: 'Painful sword',
				target: 'enemy',
				isPossible: () => true,
				effect(source, target) {
					source.hp -= cost(source);
					target.hp -= power*source.dmg;
				},
				info(source, target) {
					return [
						"Reduce target's HP by " + (power*source.dmg),
						"Reduce "+source.name+"'s HP by "+cost(source),
					];
				},
			},
		};
	};

	// === PARTY ===============================
	
	const ALLY_W = 32;
	const ALLY_H = 32;
	const ALLY_B = 16;
	const ALLY_X = 40;
	const ALLY_Y = 120;

	const makeAllyBasic = function({name, hp, mp, dmg, speed, spells, place, pictureName, equipment}) {
		const ally = {
			name: name,
			hp: hp,
			maxhp: hp,
			mp: mp,
			dmg: dmg,
			speed: speed,
			x: ALLY_X,
			y: ALLY_Y + place*(ALLY_H+ALLY_B),
			w: ALLY_W,
			h: ALLY_H,
			cd: speed*1000,
			exp: 0,
			pictureName: pictureName,
			equipment: equipment || [],
		};
		Object.defineProperty(ally, 'spells', {
			get() {
				const spells = [basicAttack]
				for(let e of ally.equipment)
					spells.push(e.spell);
				if(battle.player_data.inventory.potion > 0)
					spells.push(use_potion());
				spells.push(wait);
				return spells;
			},
		});
		return ally;
	};
	
	const allies = [];

	const module = {};
	module.customize_floor = function(floor, floor_number) {
		const data = floor.battle_data = {};
		if(floor_number === 0)
			data.distribution = [0.5, 0.5, 0.0, 0.0, 0.0];
		else
			data.distribution = [0.2, 0.2, 0.2, 0.2, 0.2];
	};
	module.initialize_allies = function() {
		allies.length = 0;

		allies.push(makeAllyBasic({
			name: "Bobette",
			hp: 28,
			mp: 20,
			dmg: 3,
			speed: 1.0+(Math.PI/100),
			spells: [magicMissile, firestorm, heal],
			place: 0,
			pictureName: 'char/hero0.png',
		}));
		allies.push(makeAllyBasic({
			name: "Muscle Sorceress",
			hp: 31,
			mp: 20,
			dmg: 2,
			speed: 1.1+(Math.PI/99),
			spells: [magicMissile, firestorm, heal],
			place: 1,
			pictureName: 'char/hero1.png',
		}));
		allies.push(makeAllyBasic({
			name: "Carl",
			hp: 29,
			mp: 20,
			dmg: 3,
			speed: 1.2+(Math.PI/98),
			spells: [magicMissile, firestorm, heal],
			place: 2,
			pictureName: 'char/hero2.png',
		}));
		allies.push(makeAllyBasic({
			name: "Dave",
			hp: 31,
			mp: 20,
			dmg: 4,
			speed: 1.3+(Math.PI/97),
			spells: [magicMissile, firestorm, heal],
			place: 3,
			pictureName: 'char/hero3.png',
		}));
	};
	module.random_loot = function(floor_number) {  // ADD CODE HERE
		if(Math.random() < .5)
			return random_sword();
		else
			return painful_sword();
	};

	const makeEnemyBasic = function({name, hp, dmg, speed, actions, place, pictureName, exp}) {
		const ENEMY_W = 32;
		const ENEMY_H = 32;
		const ENEMY_B = 16;
		const ENEMY_X = 244;
		const ENEMY_Y = 120;

		return {
			name: name,
			hp: hp,
			maxhp: hp,
			dmg: dmg,
			speed: speed,
			actions: actions,
			x: ENEMY_X,
			y: ENEMY_Y + place*(ENEMY_H+ENEMY_B),
			w: ENEMY_W,
			h: ENEMY_H,
			cd: speed*1000,
			pictureName: pictureName,
			equipment: [],
			exp: exp,
		};
	};

	module.spawn_enemies = function(floor, floor_number, is_boss) {
		const m = floor_number;  // bonus stats modifier

		if(is_boss) {
			const enemies = [];
			enemies.push(makeEnemyBasic({
				name: "Lion",
				hp: 14+8*m,
				dmg: 5+2*m,
				speed: 0.8,
				actions: [basicAttack],
				place: 0,
				pictureName: 'char/lion.png',
				exp: 3+m,
			}));
//			enemies[0].x -= 32;
			enemies[0].w = 64;
			enemies[0].h = 64;
			return enemies;
		}

		const f = function() {  // ADD CODE HERE
			const enemies = [];

			const n = util.poisson(2.5);  // Number of enemies

			const make_wolf = function(i) {
				return makeEnemyBasic({
					name: "Wolf",
					hp: 7+3*m,
					dmg: 5+m,
					speed: 1.0 + 0.3*Math.random(),
					actions: [basicAttack],
					place: i,
					pictureName: 'char/wolf.png',
					exp: 0.4 + 0.4*m,
				});
			};
			const make_tree = function(i) {
				return makeEnemyBasic({
					name: "Tree",
					hp: 7+3*m,
					dmg: 5+m,
					speed: 1.0 + 0.3*Math.random(),
					actions: [basicAttack, heal_ability],
					place: i,
					pictureName: 'char/tree.png',
					exp: 0.4 + 0.4*m,
				});
			};
			const make_bat = function(i) {
				return makeEnemyBasic({
					name: "Bat-Bird",
					hp: 7+3*m,
					dmg: 5+m,
					speed: 1.0 + 0.3*Math.random(),
					actions: [basicAttack],
					place: i,
					pictureName: 'char/bat.png',
					exp: 0.4 + 0.4*m,
				});
			};
			const make_blob = function(i) {
				return makeEnemyBasic({
					name: "Blob",
					hp: 7+3*m,
					dmg: 5+m,
					speed: 1.0 + 0.3*Math.random(),
					actions: [basicAttack],
					place: i,
					pictureName: 'char/blob.png',
					exp: 0.4 + 0.4*m,
				});
			};
			const make_lobster = function(i) {
				return makeEnemyBasic({
					name: "Lobster",
					hp: 7+3*m,
					dmg: 5+m,
					speed: 1.0 + 0.3*Math.random(),
					actions: [basicAttack],
					place: i,
					pictureName: 'char/wolf.png',
					exp: 0.4 + 0.4*m,
				});
			};

			const distr = floor.battle_data.distribution;
			for(let i=0; i<n; ++i) {
				const enemy = ([
					make_wolf,
					make_tree,
					make_bat,
					make_blob,
					make_lobster,
				][util.sample(distr)](i));
				enemies.push(enemy);
			}

/*
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
*/

			return enemies;
		};

		let result;
		do result = f()
		while(result.length === 0  ||  result.length > 7);

		return result;
	};
	
	var mxg = 0;
	var myg = 0;
        
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
    };

	module.allies = allies;

	module.initUi = function (map_ui, floor_number, enemies, fixed_cooldowns) {
		// If 'enemies' is undefined, then this is NOT a battle ...
		// Just a "healing menu".
		const no_enemies = (enemies === undefined);
		if(no_enemies)
			enemies = [];

		// Initialize people's animations
		for(let a of allies)
			a.anim = stand_anim(a);
		for(let e of enemies)
			e.anim = stand_anim(e);

		// Initialize people's cooldowns
		if(fixed_cooldowns) {
			for(let a of allies)
				a.cd = a.speed * 100;
			for(let e of enemies)
				e.cd = e.speed * 1000;
		} else {
			for(let a of allies)
				a.cd = a.speed * Math.random() * 1000;
			for(let e of enemies)
				e.cd = e.speed * Math.random() * 1000;
		}

		mxg = myg = 0;

		// Play exciting music, but only during real battles.
		if(!no_enemies)
			audio.playMusic('battle');
		
		let buttons = [];
		let spellButtons = [];
		let targetButtons = [];
		
		const BUTTON_X = 40;
		const BUTTON_Y = game.HEIGHT-40;
		const BUTTON_W = 160;
		const BUTTON_H = 30;
		const BUTTON_B = 6;


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
				const spell = active.spells[i];
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
		};


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
					action.effect(enemy, allies);
				},
				allAllies:  () => {
					action.effect(enemy, enemies);
				},
			})[action.target]();
		};


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

		const tickAnimations = function(elapsed) {
			for(let a of allies)
				a.anim.tick(elapsed);
			for(let e of enemies)
				e.anim.tick(elapsed);
		};

        const draw_bar = function(ctx, {style, amount, max, display_max,
		                                x, y, w, h                       }) {
			ctx.fillStyle = style;
			const r = Math.min(Math.max(0, amount/max), 1);
			ctx.fillRect(x, y, w*r, h);

			ctx.strokeStyle = 'black';
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.rect(x, y, w, h);
			ctx.stroke();

			const text = amount + (display_max ?  '/'+max :  '');
			ctx.font = 'bold ' + Math.floor(h*.8) + 'px sans-serif';
			ctx.textAlign = 'left';
			ctx.fillStyle = 'white';
			ctx.fillText(text, x+.2*h, y+.8*h);
		};

        var drawAllies = function(ctx) {
            ctx.textAlign = "left";
            for (var i=0; i<allies.length; i++) {
                var a = allies[i];

				// Draw name and HP
                ctx.font = "bold 18pt sans-serif";
                ctx.fillStyle = "#0f0";
                if (a.hp <= 0) ctx.fillStyle = "#888";
				var txt = a.name;
				var txtw = ctx.measureText(txt).width;
                ctx.fillText(txt, 120, 22*(i+1));

				const {x, y} = a;

				// Draw sprite
				if(a.hp > 0)
					a.anim.draw(ctx);

				// Display HP
				draw_bar(ctx, {
					style: 'red',
					amount: a.hp,
					max: a.maxhp,
					display_max: true,
					x: 20,
					y: 22*i,
					w: 50,
					h: 22,
				});

				// Display current cooldown timer
				draw_bar(ctx, {
					style: '#00a078',
					amount: Math.floor(a.cd/10),
					max: 150,
					display_max: false,
					x: 70,
					y: 22*i,
					w: 50,
					h: 22,
				});
			}
        };
        
        var drawEnemies = function(ctx) {
            for (var i=0; i<enemies.length; i++) {
                var e = enemies[i];
				
				// Draw name and HP
                ctx.font = "bold 18pt sans-serif";
                ctx.fillStyle = "#f00";
                if (e.hp <= 0) ctx.fillStyle = "#888";
                var txt = e.name;
				var txtw = ctx.measureText(txt).width;
				ctx.textAlign = "right";
                ctx.fillText(txt, game.WIDTH-120, 22*(i+1));
				
				const {x, y} = e;
				
				// Draw sprite
				if (e.hp > 0)
					e.anim.draw(ctx);
				
				// Display HP
				draw_bar(ctx, {
					style: 'red',
					amount: e.hp,
					max: e.maxhp,
					display_max: false,
					x: game.WIDTH-70,
					y: 22*i,
					w: 50,
					h: 22,
				});

				// Display current cooldown timer
				draw_bar(ctx, {
					style: '#00a078',
					amount: Math.floor(e.cd/10),
					max: 150,
					display_max: false,
					x: game.WIDTH-120,
					y: 22*i,
					w: 50,
					h: 22,
				});
            }
        };
		
		var drawMenu = function(ctx, attacker) {
			drawButton(ctx, attackButton);
			//drawButton(ctx, spellsButton);
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
			return drawButton(ctx, button);

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

		const over = function(x, y, w, h) {
			const {mx, my} = input;
			return  mx >= x  &&  mx < x+w  &&  my >= y  &&  my < y+h;
		};

		const over_button = function({x, y, w, h}) {
			return over(x, y, w, h);
		};

		const draw_info = function(ctx, lines) {
			ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
			ctx.fillRect(32, game.HEIGHT-lines.length*20-32, game.WIDTH/2-48, lines.length*20);

			ctx.fillStyle = 'white';
			ctx.font = '16px sans-serif';
			ctx.textAlign = 'left';
			for(let i=0; i<lines.length; ++i)
				ctx.fillText(lines[i], 36, game.HEIGHT-16+(i-lines.length)*20);
		};

		const display_speed = z => (100/z).toFixed(0);
				
		var drawStandard = function(ctx) {
			image.drawImage(ctx, 'room/background.png', 0, 0);
			drawAllies(ctx);
			drawEnemies(ctx);

			for(let a of allies) {
				if(a.hp <= 0  ||  !over_button(a))
					continue;

				draw_info(ctx, [
					a.name,
					a.dmg + '   strength',
					display_speed(a.speed) + '   speed',
				]);
			}
			for(let e of enemies) {
				if(e.hp <= 0  ||  !over_button(e))
					continue;

				draw_info(ctx, [
					e.name,
					e.dmg + '   strength',
					display_speed(e.speed) + '   speed',
				]);
			}
		};
		
		var drawEnd = function(ctx, victory) {
			ctx.font = "bold 24pt sans-serif";
			ctx.fillStyle = "#000";
			ctx.textAlign = "center";
			ctx.fillText("YOU " + (victory ? "WIN" : "LOSE"), game.WIDTH/2, game.HEIGHT/5);
			ctx.font = "bold 16pt sans-serif";
			ctx.fillText('Click to continue.', game.WIDTH/2, game.HEIGHT/5+30);
		};
        
		var tickAllies = function*(elapsed, resume) {
			for (var i=0; i<allies.length; i++) {
				var a = allies[i];
				if (a.cd <= 0  &&  a.hp > 0) {
					a.cd += a.speed*1000;
					yield make_menu_ui(a, resume);
					if(enemiesDead() && !no_enemies)
						break;
				}
			}
		};

        var tickEnemies = function*(elapsed, resume) {
            for (var i=0; i<enemies.length; i++) {
                var e = enemies[i];
                if (e.cd <= 0  &&  e.hp > 0) {
                    if (!alliesDead()) {
						setTimeout(resume, 500);
						yield {
							tick: tickAnimations,
							draw: drawStandard,
						};
						
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

		var victory_ui = function() {
			const old_ally_info = {};
			for(let {name, maxhp, dmg} of allies) {
				util.assert(old_ally_info[name] === undefined);
				old_ally_info[name] = {maxhp, dmg};
			}

			// Level up
			for(let a of allies) {
				// TODO: What if the ally is dead?

				const bonus = exp => Math.pow(exp, 0.4);

				const bonus_hp_0 = Math.floor(bonus(a.exp));
				const base_hp    = a.maxhp - bonus_hp_0;
				const bonus_d_0  = Math.floor(bonus(a.exp)/2);
				const base_d     = a.dmg - bonus_d_0;

				//a.exp += (floor_number+1);
				for(let e of enemies)
					a.exp += e.exp;

				const bonus_hp_1 = Math.floor(bonus(a.exp));
				const bonus_d_1  = Math.floor(bonus(a.exp)/2);
				const healing = bonus_hp_1 - bonus_hp_0;

				a.hp += healing;
				a.maxhp = base_hp + bonus_hp_1;
				a.dmg = base_d + bonus_d_1;
			}

			return {
				draw: function (ctx) {
					drawStandard(ctx);
					drawEnd(ctx, true);

					// Draw level-up information
					ctx.fillStyle = '#0f0';
					ctx.textAlign = 'left';
					ctx.font = 'bold 16px sans-serif';
					for(let a of allies) {
						const old = old_ally_info[a.name];
						let text = [];
						if(a.maxhp > old.maxhp)
							text.push('+' + (a.maxhp-old.maxhp) + ' max HP');
						if(a.dmg > old.dmg)
							text.push('+' + (a.dmg-old.dmg) + ' strength\n');
						for(let i=0; i<text.length; ++i)
							ctx.fillText(text[i], a.x+50, a.y+14+18*i);
					}
				},
				tick: tickAnimations,
	            mouse_clicked: function({mx,my}) {
					// Level-up

	                game.ui = map_ui;
					audio.playMusic('dungeon');
				},
			};
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

		const targeting_ui_ally = function(prev_ui, effect, done_with_turn) {
			const this_ui = {
				tick: tickAnimations,
				draw(ctx) {
					drawStandard(ctx);
					prev_ui.draw(ctx);

					for(let {hp, x, y, w, h} of allies) {
						if(hp <= 0)
							continue;

						if(over(x, y, w, h))
							ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
						else
							ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
						ctx.fillRect(x, y, w, h);
					}
				},
				mouse_clicked({mx, my}) {
					for(let a of allies) {
						const {hp, x, y, w, h} = a;

						if(hp <= 0)
							continue;

						if(!over(x, y, w, h))
							continue;

						effect(a);

						return done_with_turn();
					}

					// Only escape the loop when mouse is not over any ally

					prev_ui.mouse_clicked({mx, my});
				},
			};

			return this_ui;
		};

		const targeting_ui_enemy = function(prev_ui, effect, done_with_turn) {
			const this_ui = {
				tick: tickAnimations,
				draw(ctx) {
					drawStandard(ctx);
					prev_ui.draw(ctx);

					for(let {hp, x, y, w, h} of enemies) {
						if(hp <= 0)
							continue;

						if(over(x, y, w, h))
							ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
						else
							ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
						ctx.fillRect(x, y, w, h);
					}
				},
				mouse_clicked({mx, my}) {
					for(let e of enemies) {
						const {hp, x, y, w, h} = e;

						if(hp <= 0)
							continue;

						if(!over(x, y, w, h))
							continue;

						effect(e);

						return done_with_turn();
					}

					// Only escape the loop when mouse is not over any enemy

					prev_ui.mouse_clicked({mx, my});
				},
			};

			return this_ui;
		};

		const draw_button = function(ctx, {x, y, w, h, color, text}) {
			if(over(x, y, w, h))
				ctx.fillStyle = color.bright;
			else
				ctx.fillStyle = color.dark;
			ctx.fillRect(x, y, w, h);
			ctx.font = 'bold 19px sans-serif';
			ctx.fillStyle = 'white';
			ctx.textAlign = 'left';
			ctx.fillText(text, x+.2*h, y+.8*h);
		};

		var make_menu_ui = function(active, done_with_turn) {
			const W = 200;
			const X = game.WIDTH - W - 20;
			const Y = 160;
			const H = 24;

			const exit_button = {
				x: game.WIDTH/2 + 16,
				y: game.HEIGHT - 20 - 24,
				w: 200,
				h: 24,
				color: {
					bright: 'blue',
					dark:   '#44f',
				},
				text: 'Return to game',
			};

			const spells = active.spells;
			const possibilities = [];
			for(let spell of spells)
				possibilities.push(spell.isPossible(active));

			let selected;  // Index number of currently selected menu-option

			const this_ui = {
				tick: tickAnimations,
				draw(ctx) {
					const FONT_SIZE = Math.floor(H*.8);

					drawStandard(ctx);

					// Highlight the active party member
					{
						const {x, y, w, h} = active;

						ctx.strokeStyle = '#fff';
						ctx.lineWidth = 2;
						ctx.beginPath();
						ctx.rect(x, y, w, h);
						ctx.stroke();
					}

					for(let i=0; i<spells.length; ++i) {
						const y = Y+i*H;

						if(!possibilities[i])
							ctx.fillStyle = '#808080';
						else if(over(X, y, W, H)  ||  i === selected)
							ctx.fillStyle = 'blue';
						else
							ctx.fillStyle = '#44f';
						ctx.fillRect(X, y, W, H);

						ctx.font = 'bold '+FONT_SIZE+'px sans-serif';
						ctx.fillStyle = 'white';
						ctx.textAlign = 'left';
						ctx.fillText(spells[i].name, X+.2*H, y+.8*H);

						if(over(X, y, W, H))
							draw_info(ctx, spells[i].info(active));
					}

					if(no_enemies)
						draw_button(ctx, exit_button);
				},
				mouse_clicked() {
					if(no_enemies && over_button(exit_button))
						return game.ui = map_ui;

					for(let i=0; i<spells.length; ++i) {
						const y = Y+i*H;

						if(!possibilities[i] || !over(X, y, W, H))
							continue;

						const spell = spells[i];
						const effect = function(target) {
							spell.effect(active, target);
						};

						selected = i;

						return ({
							'enemy': () =>
								game.ui = targeting_ui_enemy(this_ui, effect,
								                             done_with_turn  ),
							'ally': () =>
								game.ui = targeting_ui_ally(this_ui, effect,
								                            done_with_turn   ),
							'allEnemies': () => {
								effect(enemies);
								return done_with_turn();
							},
							'allAllies': () => {
								effect(allies);
								return done_with_turn();
							},
							'none': () => {
								effect();
								return done_with_turn();
							},
						}[spell.target]());
					}
				},
			};

			// Auto-select the ATTACK button at the start
			util.assert(active.spells[0] === basicAttack);
			const effect = (target) => basicAttack.effect(active, target);
			selected = 0;
			return targeting_ui_enemy(this_ui, effect, done_with_turn);
		};
		
		var returnToCombat = function() {
			game.ui = ui;
		};
		
		var defeat_ui = {
			tick: tickAnimations,
			draw: function (ctx) {
				drawStandard(ctx);
				drawEnd(ctx, false);
				ctx.fillText('On floor: ' + floor_number, game.WIDTH/2, game.HEIGHT/2);
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
							activate();
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
			tick: tickAnimations,
		};};
        
		var ui = {
			draw: function (ctx) {
				drawStandard(ctx);
			},
			tick: function (elapsed) {
				tickAnimations(elapsed);
				tickCooldowns(elapsed);
				game.ui = game.async(function*(resume) {
					yield* tickAllies(elapsed, resume);
					yield* tickEnemies(elapsed, resume);
					if (alliesDead()) {
						audio.playMusic('lost');
						return defeat_ui;
					}
					if (enemiesDead() && !no_enemies) {
						audio.playMusic('victory');
						return victory_ui();
					}
					return ui;
				});
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
