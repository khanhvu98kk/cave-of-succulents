//---------------------------- Game constants -------------------------------
//---------------------------- START -------------------------------
var COLS = 15;
var ROWS = 10;
var HALL_SIZE = 64;
var WALL_WIDTH = 32;
var CELL_SIZE = HALL_SIZE + WALL_WIDTH;
var WIDTH = COLS*CELL_SIZE;
var HEIGHT = ROWS*CELL_SIZE;
var WALL_SCALE = 0.22;

var SPOTLIGHT_SIZE = 200;
var SPOTLIGHT_ORIG = 213;
var IS_DARK = false;

var BABY_VEL = 150;
var MONSTER_VEL = 125;
//---------------------------- Game constants -------------------------------
//---------------------------- END -------------------------------

// var player;
var walls;
var wallsList = {};
var cursors;
var adjacency;
var star;
var starCount = 0;
var bomb;
var bombCount = 0;
var succ3, succ4, succ5, succ6, succ7, succ8, succ9, succ10, succ11, succ12;

var blocker;
var spotlight;


// -------------------------- Helper Functions ------------------------------
//---------------------------- START -------------------------------

function two2one (i, j) {return (j*COLS) + i;}
function one2i (one) {return Math.floor(one / COLS);}
function one2j (one) {return one % ROWS;}

// PixLoc returns the center of the hall
function iPixLoc (i) {return CELL_SIZE * i + (HALL_SIZE/2);}
function jPixLoc (j) {return CELL_SIZE * j + (HALL_SIZE/2);}
function iWallLocTall (i) {return iPixLoc(i) + (HALL_SIZE/2) + (WALL_WIDTH/2);}
function jWallLocFlat (j) {return jPixLoc(j) + (HALL_SIZE/2) + (WALL_WIDTH/2);}
function xPixInd (x) {return Math.floor(x / CELL_SIZE);}
function yPixInd (y) {return Math.floor(y / CELL_SIZE);}

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
    wallsList = []

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
        wallsList.push([]);
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
        var iLoc = iWallLocTall(i);
        var jLoc = jPixLoc(j);
        var newWall = walls.create(iLoc, jLoc, 'tall').setScale(WALL_SCALE).refreshBody();
        wallsList[two2one(i, j)].push(newWall);
        removeAdjacency(i, j, i+1, j);
    }
    else if (orient=='flat') {
        var iLoc = iPixLoc(i);
        var jLoc = jWallLocFlat(j);
        var newWall = walls.create(iLoc, jLoc, 'flat').setScale(WALL_SCALE).refreshBody();
        wallsList[two2one(i, j)].push(newWall);
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

// destroy walls in a 3x3 area around the given center
function blastWalls (i, j) {
    for (var x = i - 1; x < i + 2; x++) {
        for (var y = j - 1; y < j + 2; y++) {
            if (!isValid(x, y))
                continue;

            console.log("Blasting: " + x + " " + y);

            var thisWalls = wallsList[two2one(x, y)];
            // console.log(thisWalls)
            for (var w = 0; w < thisWalls.length; w++) {
                var thisWall = thisWalls[w];
                // console.log(thisWall);
                thisWall.destroy();
            }
        }
    }
}

// create new maze and place objects afresh
function resetAll () {
    // create new walls
    initAdjacency();
    walls.clear(destroyChild=true);
    divide(0, 0, COLS, ROWS);

    // reposition items and make visible
    var randX = iPixLoc(randomInt(COLS));
    var randY = jPixLoc(randomInt(ROWS));
    star.x = randX;
    star.y = randY;
    star.visible = true;
    starCount = 0;

    randX = iPixLoc(randomInt(COLS));
    randY = jPixLoc(randomInt(ROWS));
    bomb.x = randX;
    bomb.y = randY;
    bomb.visible = true;
    bombCount = 0;

    // reposition player and spotlight
    player.x = iPixLoc(0);
    player.y = jPixLoc(0);
    spotlight.x = iPixLoc(0);
    spotlight.y = jPixLoc(0);

    // reposition monster
    monster.x = iPixLoc(5);
    monster.y = jPixLoc(5);
    monsterTarget.x = iPixLoc(5);
    monsterTarget.y = jPixLoc(5);
    monsterTarget.xPrev = iPixLoc(5);
    monsterTarget.yPrev = jPixLoc(5.1);
}

// update monster target
function updateTarget (monster, monsterTarget) {


}

//---------------------------- Helper Functions -------------------------------
// -------------------------------- END -------------------------------------


// -------------------------- Start Scene ------------------------------
// -------------------------------- START -------------------------------------
var start = new Phaser.Scene('start');
var button;
var timer = 0;
var succ1, succ2;
var yDown = HEIGHT * 2/3;
var yUp = HEIGHT * 1.8/3

start.preload = function () {
    this.load.image('start', 'assets/start.png');
    this.load.image('succ1', 'assets/succ1.png');
    this.load.image('succ2', 'assets/succ2.png');
    this.load.image('logo1', 'assets/logo1.png');
    this.load.image('logo2', 'assets/logo2.png');
};

start.create = function () {
    console.log(this.sys.settings.key, 'is alive');
    start.cameras.main.setBackgroundColor('#000000')
    // this.add.image(WIDTH/2, HEIGHT/3, 'gameover').setScale(0.5);
    // this.scene.bringToTop('stop');
    succ1 = this.add.image(WIDTH/4, HEIGHT * 2/3, 'succ1').setScale(0.5);
    succ2 = this.add.image(WIDTH * 3/4, HEIGHT * 2/3, 'succ2').setScale(0.5);
    this.add.image(WIDTH/2, HEIGHT/3 - 50, 'logo1').setScale(0.75);
    this.add.image(WIDTH/2, HEIGHT/3 + 80, 'logo2').setScale(0.75);
    button = this.add.image(WIDTH/2, HEIGHT * 2/3, 'start').setScale(0.5);
    button.setInteractive();

    // this.physics.enable(image, Phaser.Physics.ARCADE);
    // image.body.velocity.x=150;
    // console.log(succ1);
};

start.update = function() {
    button.on('pointerdown', () => {
          // this.scene.launch('play');
          // this.scene.bringToTop('play');
          this.scene.resume('play');
          this.scene.stop('start');
        });
    if (timer % 20 == 0) {
        if ((timer/20) % 2 == 0) {
            succ1.y = yUp;
            succ2.y = yDown;
        }
        else {
            succ1.y = yDown;
            succ2.y = yUp;
        }
    }
    timer++;
}
// -------------------------- Start Scene ------------------------------
// -------------------------------- END -------------------------------------



// -------------------------- Stop Scene ------------------------------
// -------------------------------- START -------------------------------------
var stop = new Phaser.Scene('stop');
var button;

stop.preload = function () {
    this.load.image('gameover', 'assets/stop.png');
    this.load.image('reset', 'assets/reset.png');
};

stop.create = function () {
    console.log(this.sys.settings.key, 'is alive');
    stop.cameras.main.setBackgroundColor('#000000');
    this.add.image(WIDTH/2, HEIGHT/3, 'gameover').setScale(0.5);
    // this.scene.bringToTop('stop');

    button = this.add.image(WIDTH/2, HEIGHT * 2/3, 'reset').setScale(0.5);
    button.setInteractive();
    // this.scene.launch('play');
};

stop.update = function() {
    // helloButton.on('pointerover', () => { console.log('pointerover'); });

    button.on('pointerdown', () => {
          // console.log('pointerover');
          window.location.reload();
          // this.scene.resume('start');
          // this.scene.pause('stop');
        });
}
// -------------------------- Stop Scene ------------------------------
// -------------------------------- END -------------------------------------


// -------------------------- Play Scene ------------------------------
// -------------------------------- END -------------------------------------

var play = new Phaser.Scene('play');
var player, monster;
var monsterTarget = [];

play.preload = function()
{
    this.load.image('tiles', 'assets/desert_tiles.png');
    this.load.tilemapTiledJSON('map', 'assets/desert-hard.json');

    this.load.image('sky', 'assets/sky.png');
    this.load.image('mask', 'assets/mask.png');
    this.load.image('flat', 'assets/flat3.png');
    this.load.image('tall', 'assets/tall3.png');
    this.load.image('box', 'assets/box.png');
    this.load.image('star', 'assets/star.png');
    this.load.image('bomb', 'assets/bomb.png');
    this.load.image('succ1', 'assets/succ1.png');
    this.load.image('succ2', 'assets/succ2.png');
    this.load.image('succ3', 'assets/succ3.png');
    this.load.image('succ4', 'assets/succ4.png');
    this.load.image('succ5', 'assets/succ5.png');
    this.load.image('succ6', 'assets/succ6.png');
    this.load.image('succ7', 'assets/succ7.png');
    this.load.image('succ8', 'assets/succ8.png');
    this.load.image('succ9', 'assets/succ9.png');
    this.load.image('succ10', 'assets/succ10.png');
    this.load.image('succ11', 'assets/succ11.png');
    this.load.image('succ12', 'assets/succ12.png');
    this.load.spritesheet('baby', 'assets/baby.png', { frameWidth: 32.5, frameHeight: 38 });
    this.load.spritesheet('wolf', 'assets/wolf.png', { frameWidth: 48, frameHeight: 35 });
}

play.create = function()
{
    // function addItem(item, name, scale) {              // doesn't work! Can't automate the adding of items?
    //   console.log(item);
    //   var randX = iPixLoc(randomInt(COLS)+0.5);
    //   var randY = jPixLoc(randomInt(ROWS)+0.5);
    //   item = this.physics.add.image(randX, randY, name).setScale(scale);
    // }

    var map = this.make.tilemap({key: 'map'});                  // desert background
    var tileset = map.addTilesetImage("Desert", "tiles");
    var layer = map.createStaticLayer('Ground', tileset, 0, 0);

    // this.add.image(WIDTH/2, HEIGHT/2, 'sky').setScale(1.5);

    // TODO: once the maze is done, add this back in for not walking through walls

    walls = this.physics.add.staticGroup();
    initAdjacency();

    // walls.create(400, 568, 'flat').setScale(0.1).refreshBody();
    // walls.create(700, 568, 'tall').setScale(0.1).refreshBody();
    // walls.create(300, 368, 'box').setScale(0.1).refreshBody();
    // createBoxWall(4, 6);
    // createBoxWall(4, 7);

    divide(0, 0, COLS, ROWS);
    // console.log(wallsList);

    // randomly generate items
    var randX = iPixLoc(randomInt(COLS));
    var randY = jPixLoc(randomInt(ROWS));
    star = this.physics.add.image(randX, randY, 'star').setScale(1.5);

    randX = iPixLoc(randomInt(COLS));
    randY = jPixLoc(randomInt(ROWS));
    bomb = this.physics.add.image(randX, randY, 'bomb').setScale(1.5);

    randX = iPixLoc(randomInt(COLS));
    randY = jPixLoc(randomInt(ROWS));
    succ3 = this.physics.add.image(randX, randY, 'succ3').setScale(0.07);

    randX = iPixLoc(randomInt(COLS));
    randY = jPixLoc(randomInt(ROWS));
    succ4 = this.physics.add.image(randX, randY, 'succ4').setScale(0.1);

    randX = iPixLoc(randomInt(COLS));
    randY = jPixLoc(randomInt(ROWS));
    succ5 = this.physics.add.image(randX, randY, 'succ5').setScale(0.2);

    randX = iPixLoc(randomInt(COLS));
    randY = jPixLoc(randomInt(ROWS));
    succ6 = this.physics.add.image(randX, randY, 'succ6').setScale(0.2);

    randX = iPixLoc(randomInt(COLS));
    randY = jPixLoc(randomInt(ROWS));
    succ7 = this.physics.add.image(randX, randY, 'succ7').setScale(1);

    randX = iPixLoc(randomInt(COLS));
    randY = jPixLoc(randomInt(ROWS));
    succ8 = this.physics.add.image(randX, randY, 'succ8').setScale(1);

    randX = iPixLoc(randomInt(COLS));
    randY = jPixLoc(randomInt(ROWS));
    succ9 = this.physics.add.image(randX, randY, 'succ9').setScale(1);

    randX = iPixLoc(randomInt(COLS));
    randY = jPixLoc(randomInt(ROWS));
    succ10 = this.physics.add.image(randX, randY, 'succ10').setScale(1);

    randX = iPixLoc(randomInt(COLS));
    randY = jPixLoc(randomInt(ROWS));
    succ11 = this.physics.add.image(randX, randY, 'succ11').setScale(1);

    randX = iPixLoc(randomInt(COLS));
    randY = jPixLoc(randomInt(ROWS));
    succ12 = this.physics.add.image(randX, randY, 'succ12').setScale(1);
    // ------------------adding randomly generated items ---------------------
    // --------------------------- START ----------------------------------



    // generate player and monster
    player = this.physics.add.sprite(iPixLoc(0), jPixLoc(0), 'baby');
    player.setCollideWorldBounds(true);
    monster = this.physics.add.sprite(iPixLoc(5), jPixLoc(5), 'wolf');
    monster.setCollideWorldBounds(true);
    monsterTarget.x = iPixLoc(5);
    monsterTarget.y = jPixLoc(5);
    monsterTarget.xPrev = iPixLoc(5);
    monsterTarget.yPrev = jPixLoc(5.1);
    console.log(monsterTarget);


    blocker = this.add.image(WIDTH/2, HEIGHT/2, 'box').setScale(Math.max(WIDTH, HEIGHT)/ 400);

    spotlight = this.make.sprite({
        x: iPixLoc(0),
        y: jPixLoc(0),
        key: 'mask',
        add: false
    }).setScale(SPOTLIGHT_SIZE/SPOTLIGHT_ORIG);

    blocker.mask = new Phaser.Display.Masks.BitmapMask(this, spotlight);
    blocker.mask.invertAlpha = true;
    blocker.visible = IS_DARK;


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
        frames: [ { key: 'wolf', frame: 1 } ],
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

    this.scene.launch('start');
    this.scene.bringToTop('start');
    this.scene.pause('play');
}

play.update = function() {
    // monster's movements
    var TOLERANCE = 5;
    var currX = monster.x;
    var currY = monster.y;
    var targetX = monsterTarget.x;
    var targetY = monsterTarget.y;
    if (currY > targetY + TOLERANCE) {    // up
        monster.setVelocityY(-MONSTER_VEL);
        monster.setVelocityX(0);

        monster.anims.play('w', true);
    }
    else if (currY < targetY - TOLERANCE) {   // down
        monster.setVelocityY(MONSTER_VEL);
        monster.setVelocityX(0);

        monster.anims.play('s', true);
    }
    else if (currX > targetX + TOLERANCE) {   // left
        monster.setVelocityX(-MONSTER_VEL);
        monster.setVelocityY(0);

        monster.anims.play('a', true);
    }
    else if (currX < targetX - TOLERANCE) {    // right
        monster.setVelocityX(MONSTER_VEL);
        monster.setVelocityY(0);

        monster.anims.play('d', true);
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

    // Move the Spotlight
    spotlight.x = player.x;
    spotlight.y = player.y;

    // handling collision
    // console.log(player.x, player.y);
    // console.log(monster.x, monster.y);
    if (Math.abs(player.x - monster.x) < 20  &&
        Math.abs(player.y - monster.y) < 20) {

        // TODO: actually end game!!!
        console.log("GAME OVER!");
        resetAll();
        this.scene.start('stop');
        this.scene.bringToTop('stop');
        this.scene.pause('play');
    }

    if (Math.abs(player.x - star.x) < 20  && Math.abs(player.y - star.y) < 20) {

        if(starCount > 5 && star.visible) {
            star.visible = false;
            console.log("SHINY!");

            spotlight = spotlight.setScale(1.5)
        }
        else {
            starCount++;
        }
    }

    if (Math.abs(player.x - bomb.x) < 20  && Math.abs(player.y - bomb.y) < 20) {

        if(bombCount > 5 && bomb.visible) {
            bomb.visible = false;
            console.log("BOOM!");

            var i = xPixInd(bomb.x);
            var j = yPixInd(bomb.y);

            blastWalls(i, j);
        }
        else {
            bombCount++;
        }

    }

}
// -------------------------- Play Scene ------------------------------
// -------------------------------- END -------------------------------------



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
    scene: [ play, start, stop ]
};

var game = new Phaser.Game(config);
