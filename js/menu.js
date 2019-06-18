var Menu = {

    preload : function() {
        // Load all the needed resources for the menu.
        // console.log(game);
        this.load.image('menu', './assets/menu.png');
    },

    create: function () {
        // Add a sprite to your game, here the sprite will be the game's logo
        // Parameters are : X , Y , image name (see above)
        this.add.sprite(0, 0, 'menu');

        // Add menu screen.

        // It will act as a button to start the game.
        //this.add.button(0, 0, 'menu', this.startGame, this);

    },

    startGame: function () {

        // Change the state to the actual game.
        this.state.start('Game');

    }

};
