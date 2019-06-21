//---------------------------- Game constants -------------------------------
//---------------------------- START -------------------------------
var COLS = 15;
var ROWS = 10;
var HALL_SIZE = 64;
var WALL_WIDTH = 32;
var CELL_SIZE = HALL_SIZE + WALL_WIDTH;
var WIDTH = (COLS+2)*CELL_SIZE;
var HEIGHT = ROWS*CELL_SIZE;
var WALL_SCALE = 0.22;
var ITEMS = 2;

var SPOTLIGHT_SIZE = 200;
var SPOTLIGHT_ORIG = 213;
var SPOTLIGHT_SCALE = 1;
var IS_DARK = true;
var INVINCIBLE = false;
var TIMER = 1000;

var BABY_VEL = 150;
var MONSTER_VEL = 100;
var ENDX = 1400, ENDY = 930;
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
var torch;
var torchCount = 0;
var succ3Count = 0, succ4Count = 0, succ13Count = 0;
var succ3, succ4, succ13;
var score = 0;

var blocker;
var spotlight;


// -------------------------- Helper Functions ------------------------------
//---------------------------- START -------------------------------

function two2one (i, j) {return (j*COLS) + i;}
function one2i (one) {return one % COLS;}
function one2j (one) {return Math.floor(one / COLS);}

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

function createLimit () {
    for (var j = 0; j < ROWS-1; j++)
        createWall(COLS-1, j, 'tall');
    for (var i = 0; i < COLS-1; i++)
        createWall(i, ROWS-1, 'flat');
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
    createLimit();

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
    initTarget(monster, monsterTarget);
}

// initialize monster target
function initTarget (monster, monsterTarget) {
    var i = xPixInd(monster.x);
    var j = yPixInd(monster.y);
    var neighbors = adjacency[two2one(i, j)];

    var rand = randomInt(neighbors.length);
    var newTarget = neighbors[rand];

    // initialize target
    monsterTarget.xPrev = monster.x;
    monsterTarget.yPrev = monster.y;
    monsterTarget.x = iPixLoc(one2i(newTarget));
    monsterTarget.y = jPixLoc(one2j(newTarget));
}
// update monster target
function updateTarget (monster, monsterTarget) {
    var iPrev = xPixInd(monsterTarget.xPrev);
    var jPrev = yPixInd(monsterTarget.yPrev);
    var i = xPixInd(monster.x);
    var j = yPixInd(monster.y);
    var neighbors = adjacency[two2one(i, j)];

    // remove previous direction from neighbors and check if any left
    neighbors = arrayRemove(neighbors, two2one(iPrev, jPrev));
    if (neighbors.length == 0) {
        // reverse direction
        var temp = monsterTarget.xPrev;
        monsterTarget.xPrev = monsterTarget.x;
        monsterTarget.x = temp;

        temp = monsterTarget.yPrev;
        monsterTarget.yPrev = monsterTarget.y;
        monsterTarget.y = monsterTarget.yPrev;
        return;
    }

    var rand = randomInt(neighbors.length);
    var newTarget = neighbors[rand];

    // update target
    monsterTarget.xPrev = monsterTarget.x;
    monsterTarget.yPrev = monsterTarget.y;
    monsterTarget.x = iPixLoc(one2i(newTarget));
    monsterTarget.y = jPixLoc(one2j(newTarget));
}

//---------------------------- Helper Functions ---------------------------------------
// -------------------------------- END ----------------------------------------------


// ------------------------------- Start Scene ------------------------------------------
// -------------------------------- START -------------------------------------
var start = new Phaser.Scene('start');
var button;
var timer = 0;
var succ1, succ2, logo1, logo2;
var yDown = HEIGHT * 2 / 3;
var yUp = HEIGHT * 1.8 /3;

start.preload = function () {
    this.load.image('start', 'assets/start.png');
    this.load.image('instr', 'assets/instr.png');
    this.load.image('succ1', 'assets/succ1.png');
    this.load.image('succ2', 'assets/succ2.png');
    this.load.image('logo1', 'assets/logo1.png');
    this.load.image('logo2', 'assets/logo2.png');
    this.load.image('succ4', 'assets/succ4.png');
    this.load.image('succ3', 'assets/succ3.png');
    this.load.image('succ13', 'assets/succ13.png');
    this.load.image('bomb', 'assets/bomb.png');
    this.load.image('star', 'assets/star.png');
    this.load.image('torch', 'assets/torch.png');
    this.load.image('blocker', 'assets/blocker.png');
    this.load.image('instructions', 'assets/instructions-min.png');
};

start.create = function () {
    console.log(this.sys.settings.key, 'is alive');
    start.cameras.main.setBackgroundColor('#000000');
    console.log(start.cameras.main)
    console.log(this.cameras.main)
    // this.scene.bringToTop('stop');
    blocker = this.add.image(WIDTH/2, HEIGHT/2, 'blocker').setScale(WIDTH/ 450);
    succ1 = this.add.image(WIDTH * 1/4, yUp, 'succ1').setScale(0.5);
    succ2 = this.add.image(WIDTH * 3/4, yDown, 'succ2').setScale(0.5);
    logo1 = this.add.image(WIDTH/2, HEIGHT/3 - 50, 'logo1').setScale(0.75);
    logo2 = this.add.image(WIDTH/2, HEIGHT/3 + 80, 'logo2').setScale(0.75);

    instrBtn = this.add.image(WIDTH/2, HEIGHT * 2/3 - 50, 'instr').setScale(0.4);
    instrBtn.setInteractive();
    startBtn = this.add.image(WIDTH/2, HEIGHT * 2/3 + 50, 'start').setScale(0.5);
    startBtn.setInteractive();
};

start.update = function() {
    startBtn.on('pointerdown', () => {
          // this.scene.launch('play');
          // this.scene.bringToTop('play');
          this.scene.resume('play');
          this.scene.stop('start');
        });
    instrBtn.on('pointerdown', () => {
          logo1.visible = false; // logo1.destroy(start);
          logo2.visible = false; // logo2.destroy(start);
          succ1.visible = false; // succ1.destroy(start);
          succ2.visible = false; // succ2.destroy(start);
          instrBtn.visible = false; // instrBtn.destroy(start);
        //   this.add.text(50, 50, 'Little Red (or Blue) Riding Hood is stuck in a cave!').setScale(2);
        //   this.add.text(50, 100, 'Help her solve this maze, and escape from the Big Bad Wolf.').setScale(2);
        //   this.add.text(50, 150, 'On the way, collect these succulents for points and items for power-ups:').setScale(2);

        //   this.add.image(200, 300, 'succ13').setScale(0.12);
        //   this.add.text(300, 300, 'equals 100 pts').setScale(2);
        //   this.add.image(900, 300, 'star').setScale(0.1);
        //   this.add.text(1000, 275, 'makes invincible').setScale(2);
        //   this.add.text(1000, 300, 'against Wolf').setScale(2);

        //   this.add.image(200, 425, 'succ4').setScale(0.2);
        //   this.add.text(300, 425, 'equals 200 pts').setScale(2);
        //   this.add.image(900, 425, 'bomb').setScale(0.2);
        //   this.add.text(1000, 425, 'blasts walls').setScale(2);

        //   this.add.image(200, 550, 'succ3').setScale(0.12);
        //   this.add.text(300, 550, 'equals 200 pts').setScale(2);
        //   this.add.image(900, 550, 'torch').setScale(0.2);
        //   this.add.text(1000, 550, 'increases vision').setScale(2);
        this.add.image(WIDTH/2, HEIGHT/3, 'instructions').setScale(Math.min(HEIGHT/800, WIDTH/1800) * 5/6);
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
          document.location.reload(false);
          // this.scene.resume('start');
          // this.scene.pause('stop');
        });
}
// -------------------------- Stop Scene ------------------------------
// -------------------------------- END -------------------------------------




// ----------------------------------- Win Scene -----------------------------------
// ------------------------------------ START -------------------------------------
var win = new Phaser.Scene('win');
var button, heart, bmt;
var timer = 0;
var down = HEIGHT / 4;
var up = HEIGHT / 4 - 20;

win.preload = function () {
    this.load.image('winSucc', 'assets/original.png');
    this.load.image('heart', 'assets/heart.png');
    this.load.image('reset', 'assets/reset.png');
    this.load.image('number-font', 'assets/numbers.png');
};

win.create = function () {
    console.log(this.sys.settings.key, 'is alive');
    win.cameras.main.setBackgroundColor('#000000');
    heart = this.add.image(WIDTH/2, yDown, 'heart').setScale(0.85);
    this.add.image(WIDTH/2, HEIGHT/3 + 100, 'winSucc').setScale(0.85);

    button = this.add.image(WIDTH/2, HEIGHT * 4/5 + 30, 'reset').setScale(0.5);
    button.setInteractive();

    var fontConfig = {
        image: 'number-font',
        width: 20,
        height: 26,
        chars: '0123456789X ',
        charsPerRow: 6,
        lineSpacing: 0
    }
    this.cache.bitmapFont.add('number-font', Phaser.GameObjects.RetroFont.Parse(this, fontConfig));
    this.add.text(WIDTH/2 - 85, HEIGHT * 2/3, 'Score:').setScale(2);
    bmt = this.add.bitmapText(WIDTH/2 + 35, HEIGHT * 2/3, 'number-font', '0');
    bmt.setText(score.toString());
};

win.update = function() {
    button.on('pointerdown', () => { window.location.reload(); });
    if (timer % 20 == 0) {
        if ((timer/20) % 2 == 0)
            heart.y = up;
        else
            heart.y = down;
    }
    timer++;
}
// ------------------------------------- Win Scene ------------------------------
// --------------------------------------- END -------------------------------------




// -------------------------- Play Scene ------------------------------
// -------------------------------- END -------------------------------------

var play = new Phaser.Scene('play');
var player, monster, bubble;
var monsterTarget = [];
var bmtSucc13, bmtSucc4, bmtSucc3, bmtStar, bmtBomb, bmtTorch, bmtScore;
var timerTorch = 0, timerStar = 0, timerStep = 0;
var walking = false;

play.preload = function()
{
    this.load.image('tiles', 'assets/desert_tiles.png');
    this.load.tilemapTiledJSON('map', 'assets/desert-score.json');    // tiled background
    this.load.image('number-font', 'assets/numbers.png');         // scoreboard font
    this.load.audio('steps', 'assets/steps.mp3');                 //  sounds
    this.load.audio('eating', 'assets/eating.mp3');
    this.load.audio('lightswitch', 'assets/lightswitch.mp3');
    this.load.audio('whine', 'assets/whine.mp3');
    this.load.audio('shiny', 'assets/shiny.mp3');
    this.load.audio('boom', 'assets/boom.mp3');
    this.load.image('sky', 'assets/sky.png');
    this.load.image('mask', 'assets/mask.png');
    this.load.image('flat', 'assets/flat3.png');
    this.load.image('tall', 'assets/tall3.png');
    this.load.image('blocker', 'assets/blocker.png');
    this.load.image('star', 'assets/star.png');
    this.load.image('bomb', 'assets/bomb.png');
    this.load.image('torch', 'assets/torch.png');
    this.load.image('succ3', 'assets/succ3.png');
    this.load.image('succ4', 'assets/succ4.png');
    this.load.image('succ13', 'assets/succ13.png');
    this.load.image('bubble', 'assets/bubble.png');
    this.load.spritesheet('baby', 'assets/baby.png', { frameWidth: 32.5, frameHeight: 38 });
    this.load.spritesheet('wolf', 'assets/wolf.png', { frameWidth: 48, frameHeight: 35 });
}

play.create = function()
{
    var map = this.make.tilemap({key: 'map'});                  // desert background
    var tileset = map.addTilesetImage("Desert", "tiles");
    var layer = map.createStaticLayer('Ground', tileset, 0, 0);

    this.sound.add('steps');
    this.sound.add('eating');
    this.sound.add('lightswitch');
    this.sound.add('whine');
    this.sound.add('shiny');
    this.sound.add('boom');

    walls = this.physics.add.staticGroup();
    initAdjacency();

    // create walls
    divide(0, 0, COLS, ROWS);
    createLimit();

    //------------------------ adding randomly generated items ----------------------------
    //-------------------------------- START ----------------------------------
    var randX, randY;
    star = [];
    for (var i = 0; i < ITEMS; i++) {
        randX = iPixLoc(randomInt(COLS)); randY = jPixLoc(randomInt(ROWS));
        var temp = this.physics.add.image(randX, randY, 'star').setScale(0.05);
        star.push(temp);
    }
    bomb = [];
    for (var i = 0; i < ITEMS; i++) {
        randX = iPixLoc(randomInt(COLS)); randY = jPixLoc(randomInt(ROWS));
        var temp = this.physics.add.image(randX, randY, 'bomb').setScale(0.13);
        bomb.push(temp);
    }
    torch = [];
    for (var i = 0; i < ITEMS; i++) {
        randX = iPixLoc(randomInt(COLS)); randY = jPixLoc(randomInt(ROWS));
        var temp = this.physics.add.image(randX, randY, 'torch').setScale(0.13);
        torch.push(temp);
    }
    succ13 = [];
    for (var i = 0; i < ITEMS; i++) {
        randX = iPixLoc(randomInt(COLS)); randY = jPixLoc(randomInt(ROWS));
        var temp = this.physics.add.image(randX, randY, 'succ13').setScale(0.06);
        succ13.push(temp);
    }
    succ4 = [];
    for (var i = 0; i < ITEMS; i++) {
        randX = iPixLoc(randomInt(COLS)); randY = jPixLoc(randomInt(ROWS));
        var temp = this.physics.add.image(randX, randY, 'succ4').setScale(0.1);
        succ4.push(temp);
    }
    succ3 = [];
    for (var i = 0; i < ITEMS; i++) {
        randX = iPixLoc(randomInt(COLS)); randY = jPixLoc(randomInt(ROWS));
        var temp = this.physics.add.image(randX, randY, 'succ3').setScale(0.06);
        succ3.push(temp);
    }

    // ------------------ adding randomly generated items ---------------------
    // --------------------------- START ----------------------------------


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


    // ----------------------- Scoreboard ----------------------------
    // --------------------------  START -----------------------------
    var fontConfig = {
        image: 'number-font',
        width: 20,
        height: 26,
        chars: '0123456789X ',
        charsPerRow: 6,
        lineSpacing: 0
    }
    this.cache.bitmapFont.add('number-font', Phaser.GameObjects.RetroFont.Parse(this, fontConfig));

    this.add.text(1480, 40, 'Score:').setScale(2);
    bmtScore = this.add.bitmapText((COLS+2) * CELL_SIZE - 147, 80, 'number-font', '0');

    this.add.image((COLS+2) * CELL_SIZE - 125, 180, 'succ13').setScale(0.12);
    bmtSucc13 = this.add.bitmapText((COLS+2) * CELL_SIZE - 85, 180, 'number-font', 'X0');

    this.add.image((COLS+2) * CELL_SIZE - 125, 300, 'succ4').setScale(0.2);
    bmtSucc4 = this.add.bitmapText((COLS+2) * CELL_SIZE - 85, 300, 'number-font', 'X0');

    this.add.image((COLS+2) * CELL_SIZE - 125, 425, 'succ3').setScale(0.12);
    bmtSucc3 = this.add.bitmapText((COLS+2) * CELL_SIZE - 85, 425, 'number-font', 'X0');

    this.add.image((COLS+2) * CELL_SIZE - 125, 555, 'star').setScale(0.1);
    bmtStar = this.add.bitmapText((COLS+2) * CELL_SIZE - 85, 555, 'number-font', 'X0');

    this.add.image((COLS+2) * CELL_SIZE - 125, 675, 'bomb').setScale(0.2);
    bmtBomb = this.add.bitmapText((COLS+2) * CELL_SIZE - 85, 675, 'number-font', 'X0');

    this.add.image((COLS+2) * CELL_SIZE - 125, 800, 'torch').setScale(0.2);
    bmtTorch = this.add.bitmapText((COLS+2) * CELL_SIZE - 85, 800, 'number-font', 'X0');

    // ----------------------- Scoreboard ----------------------------
    // --------------------------  END -------------------------------


    // ----------------- Generate Player and Monster -----------------
    player = this.physics.add.sprite(iPixLoc(0), jPixLoc(0), 'baby');
    player.setCollideWorldBounds(true);
    monster = this.physics.add.sprite(iPixLoc(5), jPixLoc(5), 'wolf');
    monster.setCollideWorldBounds(true);
    initTarget(monster, monsterTarget);

    bubble = this.physics.add.sprite(player.x, player.y, 'bubble').setScale(0.3);
    bubble.visible = false;

    blocker = this.add.image((COLS * CELL_SIZE)/2 - WALL_WIDTH, HEIGHT-(COLS * CELL_SIZE)/2 - WALL_WIDTH, 'blocker').setScale((COLS*CELL_SIZE)/ 450);

    spotlight = this.make.sprite({
        x: iPixLoc(0),
        y: jPixLoc(0),
        key: 'mask',
        add: false
    }).setScale(SPOTLIGHT_SIZE/SPOTLIGHT_ORIG);

    blocker.mask = new Phaser.Display.Masks.BitmapMask(this, spotlight);
    blocker.mask.invertAlpha = true;
    blocker.visible = IS_DARK;

    // ----------------- Generate Player and Monster -----------------
    // --------------------------  END -------------------------------


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
    else {
        updateTarget(monster, monsterTarget);
    }


    // Player's movements
    // --------------------------  START ------------------------------
    if (cursors.left.isDown)
    {
        player.setVelocityX(-BABY_VEL);
        player.setVelocityY(0);
        walking = true;
        player.anims.play('left', true);
    }
    else if (cursors.right.isDown)
    {
        player.setVelocityX(BABY_VEL);
        player.setVelocityY(0);
        walking = true;
        player.anims.play('right', true);
    }
    else if (cursors.up.isDown)
    {
        player.setVelocityY(-BABY_VEL);
        player.setVelocityX(0);
        walking = true;
        player.anims.play('up', true);
    }
    else if (cursors.down.isDown)
    {
        player.setVelocityY(BABY_VEL);
        player.setVelocityX(0);
        walking = true;
        player.anims.play('down', true);
    }
    else
    {
        player.setVelocityX(0);
        player.setVelocityY(0);
        walking = false;
        player.anims.play('turn');
    }
    if (walking) {
        if (timerStep <= 0) {
            timerStep = 13;
            this.sound.play('steps');
        }
        else {
            timerStep--;
        }
    }

    // --------------------------  END ------------------------------

    // Move the Spotlight
    spotlight.x = player.x;
    spotlight.y = player.y;

    // handling collision
    // console.log(player.x, player.y);
    // console.log(monster.x, monster.y);
    if (Math.abs(player.x - ENDX) < 20 && Math.abs(player.y - ENDY) < 20) {
        this.scene.start('win');
        this.scene.bringToTop('win');
        this.scene.pause('play');
    }
    if (Math.abs(player.x - monster.x) < 20  && Math.abs(player.y - monster.y) < 20) {
        if (!INVINCIBLE) {
            this.sound.play('whine');
            console.log("GAME OVER!");
            resetAll();
            this.scene.start('stop');
            this.scene.bringToTop('stop');
            this.scene.pause('play');
        }
    }

    if (timerStar > 0)
        timerStar--;
    else if (timerStar == 0){
        INVINCIBLE = false;
        bubble.visible = false;
        console.log(INVINCIBLE);
        timerStar--;
    }
    bubble.x = player.x;
    bubble.y = player.y;
    for (var i = 0; i < star.length; i++) {
        if (Math.abs(player.x - star[i].x) < 20  && Math.abs(player.y - star[i].y) < 20) {
            this.sound.play('shiny');
            starCount++;
            timerStar = TIMER;      // 500 units before not invincible anymore    // TODO: have some glow/visual indication
            bubble.visible = true;
            INVINCIBLE = true;
            console.log(INVINCIBLE);
            star[i].x = iPixLoc(randomInt(COLS));
            star[i].y = iPixLoc(randomInt(ROWS));
        }
    }
    bmtStar.setText('X' + starCount.toString());

    for (var i = 0; i < succ13.length; i++) {
        if (Math.abs(player.x - succ13[i].x) < 20  && Math.abs(player.y - succ13[i].y) < 20) {
            this.sound.play('eating');
            succ13Count++;
            score += 100;                                   // 100pt / succ13
            succ13[i].x = iPixLoc(randomInt(COLS));
            succ13[i].y = iPixLoc(randomInt(ROWS));
        }
    }
    bmtSucc13.setText('X' + succ13Count.toString());

    for (var i = 0; i < succ4.length; i++) {
        if (Math.abs(player.x - succ4[i].x) < 20  && Math.abs(player.y - succ4[i].y) < 20) {
            this.sound.play('eating');
            succ4Count++;
            score += 250;                                   // 250pt / succ4
            succ4[i].x = iPixLoc(randomInt(COLS));
            succ4[i].y = iPixLoc(randomInt(ROWS));
        }
    }
    bmtSucc4.setText('X' + succ4Count.toString());

    for (var i = 0; i < succ3.length; i++) {
        if (Math.abs(player.x - succ3[i].x) < 20  && Math.abs(player.y - succ3[i].y) < 20) {
            this.sound.play('eating');
            succ3Count++;
            score += 500;                                   // 500pt / succ3
            succ3[i].x = iPixLoc(randomInt(COLS));
            succ3[i].y = iPixLoc(randomInt(ROWS));
        }
    }
    bmtSucc3.setText('X' + succ3Count.toString());

    if (timerTorch > 0)
        timerTorch--;
    else if (timerTorch == 0) {
        SPOTLIGHT_SCALE = 1;
        spotlight = spotlight.setScale(SPOTLIGHT_SCALE);
        timerTorch--;
    }
    for (var i = 0; i < torch.length; i++) {
        if (Math.abs(player.x - torch[i].x) < 20  && Math.abs(player.y - torch[i].y) < 20) {
            this.sound.play('lightswitch');
            // TODO: should also set a timer, after which reverse spotlight scale back to 1.5?
            SPOTLIGHT_SCALE *= 1.5;
            spotlight = spotlight.setScale(SPOTLIGHT_SCALE);
            timerTorch = TIMER;
            torchCount++;
            torch[i].x = iPixLoc(randomInt(COLS));
            torch[i].y = iPixLoc(randomInt(ROWS));
        }
    }
    bmtTorch.setText('X' + torchCount.toString());


    for (var i = 0; i < bomb.length; i++) {
        if (Math.abs(player.x - bomb[i].x) < 20  && Math.abs(player.y - bomb[i].y) < 20) {
            this.sound.play('boom');
            var x = xPixInd(bomb[i].x);
            var y = yPixInd(bomb[i].y);
            blastWalls(x, y);
            bombCount++;
            bomb[i].x = iPixLoc(randomInt(COLS));
            bomb[i].y = iPixLoc(randomInt(ROWS));
        }
    }
    bmtBomb.setText('X' + bombCount.toString());

    bmtScore.setText(score.toString());   // update scoreboard

}
// -------------------------- Play Scene ------------------------------
// -------------------------------- END -------------------------------------

// document.body.style.zoom="67%"

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
    scene: [ play, start, stop, win ],
    scale: {
        mode: Phaser.Scale.FIT,
        width: WIDTH,
        height: HEIGHT
    },   
};

var game = new Phaser.Game(config);
