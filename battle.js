(function() {

const battle = modules.define('battle')
.import('game')
.import('map_screen')
.export(function (defs) {
	// Battle screen
    var game = defs.game;
    
	var module = {};
    
    var Combatant = function(name, hp, dmg, speed) {
        this.name = name;
        this.hp = hp;
        this.dmg = dmg;
        this.speed = speed;
        this.cd = 0;
    };
    
    Combatant.prototype.attack = function(target) {
        target.hp -= this.dmg;
    };
    
    Combatant.prototype.die = function(isAlly) {
        this.hp = 0;
    }
    
    var allies;
    var enemies;
	
	module.initUi = function (map_ui) {
		
		allies = [];
		enemies = [];
        
        allies.push(new Combatant("Bobette", 10, 3, 1.4));
        allies.push(new Combatant("Muscle Sorceress", 8, 3, 1.4));
        allies.push(new Combatant("Carl", 9, 3, 1.4));
        
        enemies.push(new Combatant("Foo", 3, 2, 1.5));
        enemies.push(new Combatant("Bar", 4, 2, 1.5));
        enemies.push(new Combatant("Baz", 5, 2, 2.2));
        
        var drawAllies = function(ctx) {
            ctx.textAlign = "left";
            for (var i=0; i<allies.length; i++) {
                var a = allies[i];
                ctx.font = "bold 18pt sans-serif";
                ctx.fillStyle = "#0f0";
                if (a.hp <= 0) ctx.fillStyle = "#888";
                ctx.fillText(a.name + " " + a.hp, 20, 22*(i+1));
            }
        };
        
        var drawEnemies = function(ctx) {
            ctx.textAlign = "right";
            for (var i=0; i<enemies.length; i++) {
                var e = enemies[i];
                var txt = e.name + " " + e.hp;
                ctx.font = "bold 18pt sans-serif";
                ctx.fillStyle = "#f00";
                if (e.hp <= 0) ctx.fillStyle = "#888";
                ctx.fillText(txt, game.WIDTH-20, 22*(i+1));
                //ctx.font = "bold 14pt sans-serif";
                //ctx.fillStyle = "#444";
                //ctx.fillText(e.cd.toFixed(2), Game.WIDTH-ctx.measureText(txt).width-44, 22*(i+1));
            }
        };
		
		var drawOther = function(ctx) {
			if (alliesDead()) {
				ctx.font = "bold 24pt sans-serif";
				ctx.fillStyle = "#000";
				ctx.textAlign = "center";
				ctx.fillText('YOU LOSE', game.WIDTH/2, game.HEIGHT/5);
				ctx.font = "bold 16pt sans-serif";
				ctx.fillText('Click to continue.', game.WIDTH/2, game.HEIGHT/5+30);
			}
		};
		
		var tickAllies = function(elapsed) {
			
		};
        
        var tickEnemies = function(elapsed) {
            for (var i=0; i<enemies.length; i++) {
                var e = enemies[i];
                e.cd += elapsed;
                if (e.cd >= e.speed*1000) {
                    if (!alliesDead()) {
                        var t = allies[Math.floor(Math.random()*allies.length)];
                        while (t.hp <= 0) t = allies[Math.floor(Math.random()*allies.length)];
                        e.attack(t);
                        if (t.hp <= 0) {
                            t.die(true);
                        }
                        e.cd -= e.speed*1000;
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
        
		var ui = {
			draw: function (ctx) {
				drawAllies(ctx);
				drawEnemies(ctx);
				drawOther(ctx);
			},
			tick: function (elapsed) {
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
