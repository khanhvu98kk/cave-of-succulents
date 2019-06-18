var WIDTH = 900;
var HEIGHT = 675;
var COLS = 20;
var ROWS = 15;
var BABY_VELOCITY = 150;

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

var game = new Phaser.Game(config);

function createBoxWall (walls, i, j) {
    var iLoc = WIDTH / COLS * (i + 0.5);
    var jLoc = HEIGHT / ROWS * (j + 0.5);
    walls.create(iLoc, jLoc, 'box').setScale(0.1).refreshBody();
}

function createWall (walls, i, j, orient='tall') {
    if (orient=='tall') {
        var iLoc = WIDTH / COLS * (i + 1);
        var jLoc = HEIGHT / ROWS * (j + 0.5);
        walls.create(iLoc, jLoc, 'tall').setScale(0.115).refreshBody();
    }
    else if (orient=='flat') {
        var iLoc = WIDTH / COLS * (i + 0.5);
        var jLoc = HEIGHT / ROWS * (j + 1);
        walls.create(iLoc, jLoc, 'flat').setScale(0.115).refreshBody();
    }
}

function preload ()
{
    this.load.image('sky', 'assets/sky.png');
    this.load.image('flat', 'assets/flat.png');
    this.load.image('tall', 'assets/tall.png');
    this.load.image('box', 'assets/box.png');
    this.load.image('star', 'assets/star.png');
    this.load.image('bomb', 'assets/bomb.png');
    this.load.spritesheet('baby', 'assets/baby.png', { frameWidth: 32.5, frameHeight: 38, margin:0 });
}

function create ()
{
    this.add.image(WIDTH/2, HEIGHT/2, 'sky').setScale(1.2);

    // TODO: once the maze is done, add this back in for not walking through walls

    walls = this.physics.add.staticGroup();

    // walls.create(400, 568, 'flat').setScale(0.1).refreshBody();
    // walls.create(700, 568, 'tall').setScale(0.1).refreshBody();
    // walls.create(300, 368, 'box').setScale(0.1).refreshBody();
    // createBoxWall(walls, 4, 6);
    // createBoxWall(walls, 4, 7);

    createWall(walls, 10, 10, 'tall');
    // createWall(walls, 10, 10, 'flat');
    createWall(walls, 9, 10, 'tall');
    // createWall(walls, 10, 9, 'flat');
    
    // walls.create(600, 400, 'flat');
    // walls.create(50, 250, 'flat');
    // walls.create(750, 220, 'flat');

    player = this.physics.add.sprite(WIDTH, HEIGHT, 'baby');

    player.setCollideWorldBounds(true);

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

    cursors = this.input.keyboard.createCursorKeys();

    this.physics.add.collider(player, walls);
}

function update ()
{
    if (cursors.left.isDown)
    {
        player.setVelocityX(-BABY_VELOCITY);
        player.setVelocityY(0);

        player.anims.play('left', true);
    }
    else if (cursors.right.isDown)
    {
        player.setVelocityX(BABY_VELOCITY);
        player.setVelocityY(0);

        player.anims.play('right', true);
    }
    else if (cursors.up.isDown)
    {
        player.setVelocityY(-BABY_VELOCITY);
        player.setVelocityX(0);

        player.anims.play('up', true);
    }
    else if (cursors.down.isDown)
    {
        player.setVelocityY(BABY_VELOCITY);
        player.setVelocityX(0);

        player.anims.play('down', true);
    }
    else
    {
        player.setVelocityX(0);
        player.setVelocityY(0);

        player.anims.play('turn');
    }
}