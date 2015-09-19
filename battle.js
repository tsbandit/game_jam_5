var moduleName = "battle";

window.modules = window.modules || {};
window.modules[moduleName] = (function () {
	// Battle screen
	var module = {};
    
    var Combatant = function(name, hp, str, speed) {
        this.name = name;
        this.hp = hp;
        this.str = str;
        this.speed = speed;
        this.cd = 0;
    };
    
    var allies = [];
    var enemies = [];
	
	module.initUi = function () {
        
        allies.push(new Combatant("Alice", 10, 3, 0.8));
        allies.push(new Combatant("Bob", 8, 3, 0.8));
        allies.push(new Combatant("Carl", 9, 3, 0.8));
        
        enemies.push(new Combatant("Foo", 3, 2, 0.7));
        enemies.push(new Combatant("Bar", 4, 2, 0.6));
        enemies.push(new Combatant("Baz", 5, 2, 0.63));
        
        var drawAllies = function(ctx) {
            var Game = window.modules.game;
            ctx.font = "bold 18pt sans-serif";
            ctx.textAlign = "left";
            ctx.fillStyle = "#0f0";
            for (var i=0; i<allies.length; i++) {
                var e = allies[i];
                ctx.fillText(e.name + " " + e.hp, 20, 22*(i+1));
            }
        }
        
        var drawEnemies = function(ctx) {
            var Game = window.modules.game;
            ctx.font = "bold 18pt sans-serif";
            ctx.textAlign = "right";
            ctx.fillStyle = "#f00";
            for (var i=0; i<enemies.length; i++) {
                var e = enemies[i];
                var txt = e.name + " " + e.hp;
                ctx.fillText(txt, Game.WIDTH-20, 22*(i+1));
                ctx.fillText(e.cd.toFixed(2), Game.WIDTH-120, 22*(i+1));
            }
        }
        
        var tickEnemies = function(elapsed) {
            for (var i=0; i<enemies.length; i++) {
                enemies[i].cd += 0.01*elapsed;
            }
        }
        
		var ui = {
			draw: function (ctx) {
                drawAllies(ctx);
				drawEnemies(ctx);                
			},
			tick: function (elapsed) {
				tickEnemies(elapsed);
			},
            mouse_moved: () => {
                enemies[0].hp += 3;
            },
		};
		return ui;
	};
	
	return module;
}());