(function() {
   
const party_screen = modules.define('party_screen')
.import('game')
.import('image')
.import('battle')
.export(function (defs) {
    
    const exports = {};
	const {image, game, battle} = defs;
	exports.initUi = function (prevUi) {
		
		const statOffset = 260;
		const statValueOffset = 100;
		const statLineHeight = 20;
		
		function drawPartyMember(ctx, m, x, y) {
			image.drawImage(ctx, 'char/hero.png', x + 10, y + 10);
			
			ctx.font = "bold 18pt sans-serif";
			ctx.fillStyle = "#060";
			ctx.textAlign = "left";
			ctx.fillText(m.name, x, y);
			
			ctx.font = "bold 12pt sans-serif";
			ctx.fillStyle = "#d00";
			ctx.fillText('HP', x + statOffset, y);
			ctx.fillText('POWER', x + statOffset, y + statLineHeight);
			ctx.fillText('SPEED', x + statOffset, y + statLineHeight * 2);
			
			ctx.fillStyle = "#000";
			ctx.fillText(m.hp + ' / ' + m.maxhp, x + statOffset + statValueOffset, y);
			ctx.fillText(m.dmg, x + statOffset + statValueOffset, y + statLineHeight);
			ctx.fillText(m.speed.toFixed(1), x + statOffset + statValueOffset, y + statLineHeight * 2);
		}
			
		const ui = {
			draw: function (ctx) {
				for (let i = 0; i < battle.allies.length; ++i) {
					drawPartyMember(ctx, battle.allies[i], 40, 40 + i * 100);
				}
			},
			tick: function (elapsed) {
				
			},
			mouse_clicked: function(ev) {
				game.ui = prevUi;
			}
		};

		return ui;
	};
	
	return exports;
});

}());
