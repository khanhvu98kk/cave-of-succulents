var WIDTH = 900;
var HEIGHT = 900;
var COLS = 15;
var ROWS = 15;
var BABY_VEL = 150;
var MONSTER_VEL = 125;
var WALL_SCALE = 0.105;

var config = {
    type: Phaser.AUTO,
    width: WIDTH,
    height: HEIGHT,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var player;
var walls;
var cursors;
var adjacency;
var star; 
var bomb;

var game = new Phaser.Game(config);

// -------------------------- Helper Functions ------------------------------

function two2one (i, j) {return (j*COLS) + i;}

function one2i (one) {return Math.floor(one / COLS);}

function one2j (one) {return one % ROWS;}

function iPixLoc (i) {return WIDTH / COLS * i;}

function jPixLoc (j) {return HEIGHT / ROWS * j;}

function isValid (i, j) {return i >= 0 && i < COLS && j >= 0 && j < ROWS;}

function randomInt (top) {return Math.floor(Math.random() * top);}

function arrayRemove(arr, value) {
    return arr.filter(function(ele){
        return ele != value;
    });
}

// Adjacency matrix stores each cell as an integer
// Each cell is an index in the array and has a neighbors array
// The neighbors array for a given cell contains its neighbors (as integers)
function initAdjacency () {
    adjacency = []

    for(var one = 0; one < ROWS*COLS; one++) {
        var neighbors = [];
        var i = one2i(one);
        var j = one2j(one);

        if (i > 0) 
            neighbors.push(two2one(i-1, j));
        if (i < COLS-1)
            neighbors.push(two2one(i+1, j));
        if (j > 0)
            neighbors.push(two2one(i, j-1));
        if (j < ROWS-1)
            neighbors.push(two2one(i, j+1));
        
        adjacency.push(neighbors);
    }
}

function removeAdjacency (i, j, k, l) {
    if (!isValid(i, j) || !isValid(k, l))
        return;

    // console.log("removeAdj: " + i + " " + j + " " + k + " " + l);

    var neighbors = adjacency[two2one(i, j)];
    // console.log(neighbors);
    adjacency[two2one(i, j)] = arrayRemove(neighbors, two2one(k, l));

    neighbors = adjacency[two2one(k, l)];
    // console.log(neighbors);
    adjacency[two2one(k, l)] = arrayRemove(neighbors, two2one(i, j));
}

// check if two cells are neighbors
function isNeighbor (i, j, k, l) {
    if (!isValid(i, j) || !isValid(k, l))
        return false;

    var neighbors = adjacency[two2one(i, j)];

    for (var a = 0; a < neighbors.length; a++) {
        var neighbor = neighbors[a];
        if (two2one(k, l) == neighbor)
            return true;
    }
    return false;
}

function createBoxWall (i, j) {
    var iLoc = iPixLoc(i + 0.5);
    var jLoc = jPixLoc(j + 0.5);
    walls.create(iLoc, jLoc, 'box').setScale(0.1).refreshBody();
}

function createWall (i, j, orient='tall') {
    if (orient=='tall') {
        var iLoc = iPixLoc(i + 1);
        var jLoc = jPixLoc(j + 0.5);
        walls.create(iLoc, jLoc, 'tall').setScale(WALL_SCALE).refreshBody();
        removeAdjacency(i, j, i+1, j);
    }
    else if (orient=='flat') {
        var iLoc = iPixLoc(i + 0.5);
        var jLoc = jPixLoc(j + 1);
        walls.create(iLoc, jLoc, 'flat').setScale(WALL_SCALE).refreshBody();
        removeAdjacency(i, j, i, j+1);
    }
}

// Recursive divide function, splits area into two sections by creating a wall
function divide (startX, startY, width, height) {
    if (width < 2 || height < 2)
        return;

    var horiz = false;
    if (width < height)
        horiz = true;
    
    var wall = 0; // dist of wall from start
    var gap = 0; // dist of gap from start

    // calculate random wall and gap location
    if (horiz) {
        wall = randomInt(height-2);
        gap = randomInt(width);
    }
    else {
        wall = randomInt(width-2);
        gap = randomInt(height);
    }

    // create wall 
    if (horiz) {
        var wy = startY + wall; // wall y
        var gx = startX + gap; // gap x

        for (var x = startX; x < startX + width; x++) {
            if (x == gx)
                continue;
            createWall(x, wy, 'flat');
        }
    }
    else {
        var wx = startX + wall; // wall x
        var gy = startY + gap; // gap y

        for (var y = startY; y < startY + height; y++) {
            if (y == gy)
                continue;
            createWall(wx, y, 'tall');
        }
    }

    // recurse
    if (horiz) {
        divide(startX, startY, width, wall + 1);
        divide(startX, startY + wall + 1, width, height - wall - 1);
    }
    else {
        divide(startX, startY, wall + 1, height);
        divide(startX + wall + 1, startY, width - wall - 1, height);
    }

}

// -------------------------------- END -------------------------------------

function preload ()
{
    this.load.image('sky', 'assets/sky.png');
    this.load.image('flat', 'assets/flat.png');
    this.load.image('tall', 'assets/tall.png');
    this.load.image('box', 'assets/box.png');
    this.load.image('star', 'assets/star.png');
    this.load.image('bomb', 'assets/bomb.png');
    this.load.spritesheet('baby', 'assets/baby.png', { frameWidth: 32.5, frameHeight: 38 });
    this.load.spritesheet('wolf', 'assets/wolf.png', { frameWidth: 48, frameHeight: 35 });
}

function create ()
{
    this.add.image(WIDTH/2, HEIGHT/2, 'sky').setScale(1.5);

    // TODO: once the maze is done, add this back in for not walking through walls

    walls = this.physics.add.staticGroup();
    initAdjacency();
    console.log(isNeighbor(0, 1, 1, 1));
    console.log(isNeighbor(3, 4, 5, 4));

    // walls.create(400, 568, 'flat').setScale(0.1).refreshBody();
    // walls.create(700, 568, 'tall').setScale(0.1).refreshBody();
    // walls.create(300, 368, 'box').setScale(0.1).refreshBody();
    // createBoxWall(4, 6);
    // createBoxWall(4, 7);

    divide(0, 0, COLS, ROWS);

    // randomly generate items
    var randX = iPixLoc(randomInt(COLS)+0.5);
    var randY = jPixLoc(randomInt(ROWS)+0.5);
    star = this.physics.add.image(randX, randY, 'star').setScale(1.5);

    randX = iPixLoc(randomInt(COLS)+0.5);
    randY = jPixLoc(randomInt(ROWS)+0.5);
    bomb = this.physics.add.image(randX, randY, 'bomb').setScale(1.5);

    // generate player and monster
    player = this.physics.add.sprite(0, 0, 'baby');
    player.setCollideWorldBounds(true);
    monster = this.physics.add.sprite(iPixLoc(5.5), jPixLoc(5.5), 'wolf');
    monster.setCollideWorldBounds(true);


    // Player's movements
    // --------------------------  START ------------------------------
    this.anims.create({
        key: 'left',
        frames: this.anims.generateFrameNumbers('baby', { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1
    });
    this.anims.create({
        key: 'up',
        frames: this.anims.generateFrameNumbers('baby', { start: 9, end: 12 }),
        frameRate: 10,
        repeat: -1
    });
    this.anims.create({
        key: 'turn',
        frames: [ { key: 'baby', frame: 4 } ],
        frameRate: 20
    });
    this.anims.create({
        key: 'right',
        frames: this.anims.generateFrameNumbers('baby', { start: 5, end: 8 }),
        frameRate: 10,
        repeat: -1
    });
    this.anims.create({
        key: 'down',
        frames: this.anims.generateFrameNumbers('baby', { start: 13, end: 16 }),
        frameRate: 10,
        repeat: -1
    });
    // --------------------------  END ------------------------------


    // Monster's movements
    // --------------------------  START ------------------------------
    this.anims.create({
        key: 'a',
        frames: this.anims.generateFrameNumbers('wolf', { start: 3, end: 5 }),
        frameRate: 10,
        repeat: -1
    });
    this.anims.create({
        key: 'w',
        frames: this.anims.generateFrameNumbers('wolf', { start: 9, end: 11 }),
        frameRate: 10,
        repeat: -1
    });
    this.anims.create({
        key: 'f',
        frames: [ { key: 'dude', frame: 1 } ],
        frameRate: 20
    });
    this.anims.create({
        key: 'd',
        frames: this.anims.generateFrameNumbers('wolf', { start: 6, end: 8 }),
        frameRate: 10,
        repeat: -1
    });
    this.anims.create({
        key: 's',
        frames: this.anims.generateFrameNumbers('wolf', { start: 0, end: 2 }),
        frameRate: 10,
        repeat: -1
    });
    // --------------------------  END ------------------------------


    cursors = this.input.keyboard.createCursorKeys();

    this.physics.add.collider(player, walls);
    this.physics.add.collider(monster, walls);
}

function update ()
{
  // monster's movements
  var num = Math.random() * 100;
  if (num >= 98) {  // then change direction
      var dir = Math.random() * 100;
      if (dir <= 25) {    // up
          monster.setVelocityY(-MONSTER_VEL);
          monster.setVelocityX(0);

          monster.anims.play('w', true);
      }
      else if (dir <= 50) {   // down
          monster.setVelocityY(MONSTER_VEL);
          monster.setVelocityX(0);

          monster.anims.play('s', true);
      }
      else if (dir <= 75) {   // left
          monster.setVelocityX(-MONSTER_VEL);
          monster.setVelocityY(0);

          monster.anims.play('a', true);
      }
      else {            // right
          monster.setVelocityX(MONSTER_VEL);
          monster.setVelocityY(0);

          monster.anims.play('d', true);
      }
  }


  // Player's movements
  // --------------------------  START ------------------------------
  if (cursors.left.isDown)
  {
      player.setVelocityX(-BABY_VEL);
      player.setVelocityY(0);

      player.anims.play('left', true);
  }
  else if (cursors.right.isDown)
  {
      player.setVelocityX(BABY_VEL);
      player.setVelocityY(0);

      player.anims.play('right', true);
  }
  else if (cursors.up.isDown)
  {
      player.setVelocityY(-BABY_VEL);
      player.setVelocityX(0);

      player.anims.play('up', true);
  }
  else if (cursors.down.isDown)
  {
      player.setVelocityY(BABY_VEL);
      player.setVelocityX(0);

      player.anims.play('down', true);
  }
  else
  {
      player.setVelocityX(0);
      player.setVelocityY(0);

      player.anims.play('turn');
  }
  // --------------------------  END ------------------------------


  // handling collision
  // console.log(player.x, player.y);
  // console.log(monster.x, monster.y);
  if (Math.abs(player.x - monster.x) < 20  &&
      Math.abs(player.y - monster.y) < 20) {

      // TODO: actually end game!!!
      console.log("GAME OVER!");
  }

  if (Math.abs(player.x - star.x) < 20  && Math.abs(player.y - star.y) < 20) {

    // TODO: actually use the item
    console.log("SHINY!");
  }

  if (Math.abs(player.x - bomb.x) < 20  && Math.abs(player.y - bomb.y) < 20) {

    // TODO: actually use the item
    console.log("BOOM!");
  }

}
