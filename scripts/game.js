 "use strict";
 
 var loader = setInterval(function () {
	if(document.readyState !== "complete") return;
	clearInterval(loader);

	Game.init();
 }, 300);
 
const STEP_SIZE = 10;
const E_STEP_SIZE = 3;

const ED_RIGHT = 1;
const ED_LEFT = 0;

 function Position() {
	return {
		x: 0,
		y: 0,
	};
 }
 
 function Size() {
	return {
		height: 10,
		width: 10,
	}
 }
 
 var Game = {
	startEnemyX: 20,
	startEnemyY: 10,

	canvas: null,
	ctx: null,
	objects: [],
	enemy_direction: ED_RIGHT,
	enemy_step: E_STEP_SIZE,
	lost: false,
	won: false,
	mainLoopInterval: 0,
	
	drawBackground: function() {
		Game.ctx.fillStyle = 'lightgray';
		Game.ctx.fillRect(0, 0, Game.canvas.width, Game.canvas.height);
	},
	
	draw: function() {
			Game.drawBackground();
			for(let o in Game.objects) {
				if(typeof Game.objects[o].draw === "function") {
					Game.objects[o].draw();
				}
			}

			if(Game.won) {
				Game.ctx.fillStyle = "black";
				Game.ctx.font = "30px Arial";
				Game.ctx.strokeText("Winner", 10, 50);
			} else if(Game.lost) {
				Game.ctx.fillStyle = "black";
				Game.ctx.fillRect(0, 0, Game.canvas.width, Game.canvas.height);
				Game.ctx.font = "30px Arial";
				Game.ctx.fillStyle = "white";
				Game.ctx.fillText("Game Over", 10, 50);
			}
	},

	mainloop: function() {
		if(Game.over()) {
			clearInterval(Game.mainLoopInterval);
			window.removeEventListener("keydown", Game.eKeyDownListener);
			Game.draw();
			return;
		}

		Game.draw();
		let objs = {...Game.objects};

		let enemies = Game.objects.filter(o => o instanceof Enemy)
		let eminx = Game.canvas.width;
		let emaxx = 0;
		for(let e in enemies) {
			eminx = enemies[e].pos.x < eminx ? enemies[e].pos.x : eminx;
			emaxx = enemies[e].pos.x + enemies[e].size.width > emaxx ?
				enemies[e].pos.x + enemies[e].size.width : emaxx;
		}

		let dy = 0;
		if(Game.canvas.width - emaxx < Game.enemy_step) {
			Game.enemy_direction = ED_LEFT;
			dy += 10;
		} else if(eminx < Game.enemy_step) {
			Game.enemy_direction = ED_RIGHT;
			Game.enemy_step += 1;
			dy += 10;
		}

		let dx = Game.enemy_direction === ED_LEFT ? -Game.enemy_step : Game.enemy_step;
		enemies.forEach(e => e.move(dx, dy));

		for(let o in objs) {
			if(typeof objs[o].step === "function") {
				objs[o].step();
			}
		}
	 },

	 over: function() {
		let enemies = Game.objects.filter(e => e instanceof Enemy);
		if(enemies.length === 0) {
			Game.won = true;
		} else if(enemies.find(e => e.pos.y + e.size.height >= Game.player.pos.y) != undefined) {
			Game.lost = true;
		} else {
			return false;
		}

		return true;
	 },

	 eKeyDownListener: function(e) {
		if(e.code === "ArrowRight") {
			Game.player.move(STEP_SIZE, 0);
		}
		if(e.code === "ArrowLeft") {
			Game.player.move(-STEP_SIZE, 0);
		}
		if(e.code === "Space") {
			let projectiles = Game.objects.filter(p => p instanceof Projectile);
			let maxy = 0;
			for(let o in projectiles) {
				maxy = projectiles[o].pos.y+projectiles[o].size.height;
			}

			if(maxy < Game.canvas.height*0.75) {
				let projectile = new Projectile();
				projectile.pos.x = Game.player.pos.x+(Game.player.size.width/2);
				projectile.pos.y = Game.player.pos.y-(Game.player.size.height/2);
			}
		}
	  },

	 init: function() {
		Game.canvas = document.getElementById("game");
		Game.ctx = Game.canvas.getContext('2d');
		Game.player = new Player();
	
		let ENEMY_QUANTITY_ROW = 10;
		for(let r = 0; r < 3;r++) {
			for(let i = 0;i < ENEMY_QUANTITY_ROW;i++) {
				let enemy = new Enemy();
				enemy.pos.x = Game.startEnemyX + (enemy.size.width + 10)*i;
				enemy.pos.y = Game.startEnemyY + (enemy.size.height + 10)*r;
			}
		}

		window.addEventListener('keydown', Game.eKeyDownListener);
	
		Game.draw();
		Game.mainLoopInterval = setInterval(Game.mainloop, 1000/30);
	 },

	 addGameObject: function(o) {
		Game.objects.push(o);
	 },

	 deleteGameObject: function(o) {
		Game.objects = Game.objects.filter(e => e!==o);
	 },
 }
 
 function GameObject() {
	this.pos = new Position();
    this.size = new Size();
	this.step = function() {};

	this.intersect = function (o) {
		function intersect1d(x1, x2, x3, x4) {
			return !(Math.max(x1, x2) < Math.min(x3, x4) ||
				Math.min(x1, x2) > Math.max(x3, x4));
		}

		let intersectx = intersect1d(	o.pos.x,
										o.pos.x+o.size.width,
										this.pos.x,
										this.pos.x+this.size.width);
		let intersecty = intersect1d(	o.pos.y,
										o.pos.y+o.size.height,
										this.pos.y,
										this.pos.y+this.size.height)
		if(intersectx && intersecty) {
			return true;
		}
		return false;
		}

	Game.addGameObject(this);
	return this;
 }

 function EnemyHerd() {

 }
 
 const Drawable = {
	color: "black",
	
	draw: function() {
		Game.ctx.fillStyle = this.color;
		Game.ctx.fillRect(this.pos.x, this.pos.y, this.size.width, this.size.height);
	},
 }
 
 const Movable = {
	move: function(dx, dy) {
			let newx = this.pos.x + dx;
			let newy = this.pos.y + dy;
			
			// FIXME: collision detection
			
			// all fine
			this.pos.x = newx;
			this.pos.y = newy;
	}
 }
 
 function Player() {
	GameObject.call(this);
	Object.assign(this,
		 Movable,
		 Drawable,
	);

	this.move = function(dx, dy) {
		if(dy > 0) {
			throw Error("Player move dy cannot be greater than 0");
		}

		if(dx+this.pos.x+this.size.width > Game.canvas.width) {
			return;
		}

		if(dx+this.pos.x < 0) {
			return;
		}

		Movable.move.call(this, dx, dy);
	}

	this.size.height = 10;
	this.size.width = 20;
	this.pos.x = 10;
	this.pos.y = Game.canvas.height-this.size.height-20;
	return this;
 }

 function Enemy() {
	GameObject.call(this);
	Object.assign(this,
		Movable,
		Drawable,
	);

	this.draw = function() {
		if(this.img.complete) {
			Game.ctx.drawImage(this.img, this.pos.x, this.pos.y)
		};
	}

	this.img = new Image();   // Create new img element
	this.img.src = './images/alien.png'; // Set source path
	this.size.height = this.DEFAULT_HEIGHT;
	this.size.width = this.DEFAULT_WIDTH;


 }

 Enemy.prototype.DEFAULT_HEIGHT = 10;
 Enemy.prototype.DEFAULT_WIDTH = 20;

 function Projectile() {
	GameObject.call(this);
	Object.assign(this,
		Movable,
		Drawable,
	);

	this.step = function() {
		this.move(0,-5);
		let enemy = Game.objects.filter(e => e instanceof Enemy)
								.find(e => this.intersect(e));
		if(enemy !== undefined) {
			Game.deleteGameObject(enemy);
			Game.deleteGameObject(this);
		}
	}

	this.move = function(dx, dy) {
		Movable.move.call(this, dx, dy);
		if(this.pos.y < 0) {
			Game.deleteGameObject(this);
			return;
		}


	}

	this.size.height = 10;
	this.size.width = 2;
	return this;
 }
