var WIDTH = 800;
var HEIGHT = 600;

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
    }
    // scene: {
    //     preload: preload,
    //     create: create,
    //     update: update
    // }
};

var game = new Phaser.Game(config);

// game = new Phaser.Game(600, 450, Phaser.AUTO, '');

game.scene.add('Menu', Menu);
game.scene.add('Game', Game);
game.scene.add('Game_Over', Game_Over);


game.scene.start('Menu');
