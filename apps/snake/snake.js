
function Position(x,y) {
    this.x = x;
    this.y = y;
    this.equals = function(pos) {
        return pos.x == this.x && pos.y == this.y;
    }
}
var Action = {
  None : {value: 0, name: "None"},
  Pause: {value: 1, name: "Pause"},
  Steer: {value: 2, name: "Steer"},
  ToggleMusic: {value: 3, name: "ToggleMusic"}
};

var Direction = {
  None : {value: 0, name: "None"},
  North: {value: 1, name: "North"},
  East : {value: 2, name: "East"},
  South: {value: 3, name: "South"},
  West : {value: 4, name: "West"}
};
 
function Food(x,y) {
    this.segment = new Position(x,y);
}

Food.prototype.update = 
function() {
}

Food.prototype.render =
function(renderContext) {
    renderContext.drawCircle(this.segment.x, this.segment.y, 2, "#CC3333", "#FF6666");
}

function Snake(x,y,length) {
    this.direction = Direction.North;
    this.speed = 1;
    this.musicOn = true;
    this.eating = false;
    this.dead = false;
    this.segments = new Array(length);
    this.sounds = {
        eating: new Audio("audio/gulp.mp3"),
        dying: new Audio("audio/boing.mp3"),
        music: new Audio("audio/music.mp3")
    };
    this.createSegments(x,y);
    this.sounds["music"].volume = 0.2;
}

Snake.prototype.createSegments = 
function(x,y) {
    if (this.musicOn) {
        this.playSound("music");
    }
    for(var ix = 0; ix < this.segments.length; ix++) {
        this.segments[ix] = new Position(x,y+ix);
    }
}

Snake.prototype.feed =
function() {
    this.playSound("eating");
    this.eating = true;
}

Snake.prototype.kill =
function() { 
    this.stopSound("music");
    this.playSound("dying");
    this.dead = true;
}

Snake.prototype.playSound =
function(name) {
    var snd = this.sounds[name];
    if(snd) {
        snd.play();
    }
}

Snake.prototype.stopSound =
function(name) {
    var snd = this.sounds[name];
    if(snd) {
        snd.pause();
    }
}

Snake.prototype.toggleMusic = 
function() {
    this.musicOn = !this.musicOn;
    if(this.musicOn) {
        this.playSound("music");
    } else {
        this.stopSound("music");
    }
}

Snake.prototype.testHit = 
function(minX, minY, maxX, maxY) {
    if(this.segments.length > 0) {
        var snakeHeadPos = this.segments[0];
        if(this.segments.length > 1) {
            for(var ix = 1; ix < this.segments.length; ix++) {
                if(snakeHeadPos.equals(this.segments[ix])) {
                    // Snake Hit Self!
                    return true;
                }
            }
        }

        if(snakeHeadPos.x <= minX || snakeHeadPos.y <= minY ||
           snakeHeadPos.x >= maxX || snakeHeadPos.y >= maxY) {
            // Board Hit!
            return true;
        }
    }
    return false;
}

Snake.prototype.changeDirection =
function(heading) {
    if((heading.value > 0) && 
        (heading.value % 2 != this.direction.value % 2)) {
        this.direction = heading;
    }
}

Snake.prototype.getNewHeadPosition =
function() {
    if(this.segments.length > 0) {
        var headPos = this.segments[0];
        switch(this.direction.value) {
            case Direction.North.value:
                return new Position(headPos.x,headPos.y-1);
            case Direction.South.value:
                return new Position(headPos.x,headPos.y+1);
            case Direction.West.value:
                return new Position(headPos.x-1,headPos.y);
            case Direction.East.value:
                return new Position(headPos.x+1,headPos.y);
        }
    }
    return null;
}

Snake.prototype.update = 
function() {
    var updLength = this.eating ? this.segments.length+1 : this.segments.length;
    var updSegments = new Array(updLength);
    var updHeadPos = this.getNewHeadPosition();
    if(updHeadPos) {
        updSegments[0] = updHeadPos;
        for(var ix=1;ix<updLength;ix++) {
            updSegments[ix] = this.segments[ix-1];
        }
    }

    this.eating = false;
    this.segments = updSegments;
}

Snake.prototype.render =
function(renderContext) {
    for(var ix = 0; ix < this.segments.length; ix++) {
        var x = this.segments[ix].x;
        var y = this.segments[ix].y;
        var fillColor = this.dead ? "#CCCCCC" : "#33AA33";
        var strokeColor = this.dead ? "#000000" : "#00FF00";

        renderContext.drawRect(x, y, 2, fillColor, strokeColor);
    }
}

function SnakeBoardRenderContext(canvasId, width, height) {
    this.canvasId = canvasId;
    this.canvas = document.getElementById(this.canvasId);
    this.context2d = this.canvas.getContext("2d");
    this.cellWidth = this.canvas.width/width;
    this.cellHeight = this.canvas.height/height;
}

SnakeBoardRenderContext.prototype.drawRect =
function(x, y, lineWidth, fillStyle, strokeStyle) {
    var ctx = this.context2d;
    var realX = (this.cellWidth * x);
    var realY = (this.cellHeight * y);

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(realX,realY);
    ctx.lineTo(realX+this.cellWidth-1,realY);
    ctx.lineTo(realX+this.cellWidth-1,realY+this.cellHeight-1);
    ctx.lineTo(realX,realY+this.cellHeight-1);
    ctx.lineTo(realX,realY);

    ctx.lineWidth = lineWidth;
    if(fillStyle) {
        ctx.fillStyle = fillStyle;
        ctx.fill();
    }
    if(strokeStyle) {
        ctx.strokeStyle = strokeStyle;
        ctx.stroke();
    }
    ctx.closePath();
    ctx.restore();
}

SnakeBoardRenderContext.prototype.drawCircle = 
function(x, y, lineWidth, fillStyle, strokeStyle) {
    var ctx = this.context2d;

    var realX = (this.cellWidth * x) + (this.cellWidth/2);
    var realY = (this.cellHeight * y) + (this.cellHeight/2);
    var radius = (this.cellWidth/2)-2;
    if(this.cellHeight > this.cellWidth) {
        radius = (this.cellHeight/2)-2;
    }

    ctx.save();
    ctx.beginPath();
    ctx.arc(realX, realY, radius, 0, 2*Math.PI);
    ctx.lineWidth = lineWidth;
    if(fillStyle) {
        ctx.fillStyle = fillStyle;
        ctx.fill();
    }
    if(strokeStyle) {
        ctx.strokeStyle = strokeStyle;
        ctx.stroke();
    }
    ctx.closePath();
    ctx.restore();
}

SnakeBoardRenderContext.prototype.drawGrid = 
function() {
    var ctx = this.context2d;
}

SnakeBoardRenderContext.prototype.clear = 
function() {
    var ctx = this.context2d;
    ctx.save();
    ctx.setTransform(1,0,0,1,0,0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.restore();
}

function SnakeBoard(canvasId) {
    this.canvasId = canvasId;
    this.debug = false;
    this.width = 25;
    this.height = 25;
    this.gridSize = 24;
    this.startSpeed = 20;
    this.gameSpeed = this.startSpeed;
    this.gameTicks = 0;
    this.updateOnTick = 0;
    this.paused = true;

    this.resetGame();

    var keyFunc = (
        function(ref) { 
            return function(e) { ref.onKeyDown(e); };
        })(this);
    $("body").keydown(keyFunc);
    
    var timerFunc = (
        function(ref) {
            return function() { ref.onTimer(); };
        })(this);
    $.timer(timerFunc).set({time:10,autostart:true});
}

SnakeBoard.prototype.getStatusMessage = 
function() {
    var msg = "Length = "+this.snake.segments.length;
    if(this.snake.dead) {
        msg += ' (GAME OVER)'
    } else if (this.paused) {
        msg += ' (PAUSED)'
    }

    if(this.debug) {
        var tickStatus = 'Ticks ('+this.gameTicks+')';
        var updateStatus = 'Next Update ('+this.updateOnTick+')';
        var actionStatus = this.action ? this.action.name : 'n/a';
        var headingStatus = this.snakeHeading ? this.snakeHeading.name : 'n/a';
    
        msg += ' :: '+tickStatus
              +' :: '+updateStatus
              +' :: '+actionStatus
              +' :: '+headingStatus;
    }

    return msg;
}

SnakeBoard.prototype.startGame = 
function() {
    if(this.updateOnTick == 0) {
        this.resetGame();
    }
    this.paused = false;
}

SnakeBoard.prototype.resetGame =
function() {
    this.gameSpeed = this.startSpeed;
    this.gameTicks = 0;
    this.updateOnTick = this.gameSpeed;
    this.snake = this.createSnake();
    this.food = this.createFood();
}

SnakeBoard.prototype.stopGame =
function() {
    this.paused = true;
}

SnakeBoard.prototype.setAction =
function(act,heading) {
    this.action = act;
    this.snakeHeading = heading;
}

SnakeBoard.prototype.clearAction =
function() {
    this.action = Action.None;
    this.snakeHeading = Direction.None;
}

SnakeBoard.prototype.onKeyDown = 
function(evt) {
    var keyHandlers = {
        'K32': {action: Action.Pause, heading: Direction.None},
        'K37': {action: Action.Steer, heading: Direction.West},
        'K38': {action: Action.Steer, heading: Direction.North},
        'K39': {action: Action.Steer, heading: Direction.East},
        'K40': {action: Action.Steer, heading: Direction.South},
        'K77': {action: Action.ToggleMusic, heading: Direction.None}
    };

    var eventKey = 'K'+evt.which;
    if(eventKey in keyHandlers) {
        var handler = keyHandlers[eventKey];
        this.setAction(handler.action, handler.heading);
    }
}

SnakeBoard.prototype.onTimer = 
function() {
    // Start/Stop Game
    this.handlePause();
    // Toggle the music
    this.handleToggleMusic();

    if(!this.paused) {
        this.gameTicks += 1;
        if(this.gameTicks == this.updateOnTick) {
            this.updateOnTick += this.gameSpeed;
            
            // Speed up as snake gets longer
            this.updateGameSpeed();
            // Check Snake Can Eat
            this.updateFeedSnake();
            // Move Snake
            this.updateMoveSnake();
            // Check Snake Is Alive
            this.updatePokeSnake();
        }
    }
    this.render();
}

SnakeBoard.prototype.updateGameSpeed = 
function() {
    var snakeSpeed = (this.snake.segments.length - 10)/4;
    snakeSpeed = Math.max(0,snakeSpeed);
    snakeSpeed = Math.min(10,snakeSpeed);
    var speed = Math.floor(this.startSpeed - snakeSpeed);
    this.gameSpeed = Math.max(1,speed);
}

SnakeBoard.prototype.handlePause =
function() {
    if(this.action == Action.Pause) {
        if(this.paused) {
            this.startGame();
        } else {
            this.stopGame();
        }
        this.clearAction();
    }
}

SnakeBoard.prototype.handleToggleMusic = 
function() {
    if(this.action == Action.ToggleMusic) {
        this.snake.toggleMusic();
        this.clearAction();
    }
}

SnakeBoard.prototype.updateFeedSnake = 
function() {
    if(this.snake.segments.length > 0) {
        var snakePos = this.snake.segments[0];
        var foodPos = this.food.segment;
        if(snakePos.equals(foodPos)) {
            this.snake.feed();
            this.food = this.createFood();
        }
    }
}

SnakeBoard.prototype.updateMoveSnake =
function() {
    if(this.action == Action.Steer) {
        this.snake.changeDirection(this.snakeHeading);
        this.clearAction();
    }
    this.snake.update();
}

SnakeBoard.prototype.updatePokeSnake = 
function() {
    if(this.snake.testHit(0,0,this.width-1,this.height-1)) {
        this.updateOnTick = 0;
        this.snake.kill();
        this.stopGame();
    }
}

SnakeBoard.prototype.render = 
function() {
    var ctx = new SnakeBoardRenderContext(this.canvasId, this.width, this.height);
    this.eraseBoard(ctx);
    this.renderBoard(ctx);
    this.food.render(ctx);
    this.snake.render(ctx);
}

SnakeBoard.prototype.eraseBoard = 
function(renderContext) {
    renderContext.clear();
}

SnakeBoard.prototype.renderBoard = 
function(renderContext) {
    $("#snakestatus").text(this.getStatusMessage());
    renderContext.drawGrid();

    var borderColor = "#FFFFFF";
    for(var ix=0; ix < this.width; ix++) {
        renderContext.drawRect(ix,0,2,borderColor,borderColor);
        renderContext.drawRect(ix,this.height-1,2,borderColor,borderColor);
    }
    for(var iy=0; iy < this.height; iy++) {
        renderContext.drawRect(0,iy,2,borderColor,borderColor);
        renderContext.drawRect(this.width-1,iy,2,borderColor,borderColor);
    }
}

SnakeBoard.prototype.createSnake =
function() {
    return new Snake(Math.floor(this.width/2),Math.floor(this.height/2),5);
}
SnakeBoard.prototype.createFood =
function() {
    var foodItem = null;
    do {
        var snakeOccupied = false;
        var randomX = Math.floor(Math.random()*(this.width-2)+1);
        var randomY = Math.floor(Math.random()*(this.height-2)+1);
        for(var ix=0; ix < this.snake.segments.length && !snakeOccupied; ix++) {
            var segment = this.snake.segments[ix];
            if (segment.x == randomX && segment.y == randomY) {
                snakeOccupied = true;
            }
        }

        if(!snakeOccupied) {
            foodItem = new Food(randomX,randomY);
        }
    } while(!foodItem);

    return foodItem;
}


