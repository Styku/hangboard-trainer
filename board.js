class Timer {
    start_timestamp;
    display_element;
    handle;

    constructor(display_element) {
        this.display_element = document.getElementById(display_element);
        this.display();
    }

    display() {
        let time_passed = 0;
        if(this.start_timestamp) {
            time_passed = this.start_timestamp.getTime() - (new Date()).getTime();
        }
        if(time_passed < 0 ) {
            time_passed = 0;
        }
        const ms = String(time_passed % 1000).padStart(3, '0');
        time_passed = Math.floor(time_passed/1000);
        const s = String(time_passed % 60).padStart(2, '0');
        time_passed = Math.floor(time_passed/60);
        const m = String(time_passed % 60).padStart(2, '0');
        time_passed = Math.floor(time_passed/24);
        const h = String(time_passed % 24).padStart(2, '0');
        const time_string = `${h}:${m}:${s}:${ms}`;

        this.display_element.innerText = time_string;

        if(time_passed < 0 && this.handle) {
            time_passed = 0;
            clearInterval(this.handle);
        }
    }

    start(time) {
        this.start_timestamp = new Date();
        this.start_timestamp.setSeconds(this.start_timestamp.getSeconds() + time);
        this.handle = setInterval(this.display.bind(this), 5);
    }
}

class Hang {
    width;
    height;
    x;
    y;

    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
    }
}

class Hangboard {
    hangs = [];
    active_hangs = new Set();

    get active() { return this.active_hangs; }
    set active(active) { this.active_hangs = new Set(active); }
    get size() { return this.hangs.length; }

    update(str) {
        this.hangs = [];
        let rows = str.split('\n');
        let total_height = rows.length;
        let y = 0;
        let height = 1/total_height;
        for(let row of rows) {
            let hangs = row.split(/\s+/);
            let total_width = hangs.reduce((p, c) => p + c.length, 0);
            let x = 0;
            for(let hang of hangs) {
                if(!hang) continue;
                let width = 1/total_width * hang.length;
                this.hangs.push(new Hang(x, y, width, height));
                x += width;
            }
            y += height;
        }
    }
}

class Canvas {
    container;
    canvas;
    context;
    hangboard = new Hangboard();
    padding_ratio = 0.02;
    border_ratio = 0.07;
    editor;
    texture;

    constructor() {
        console.log("constructor called");
        this.editor = document.getElementById('editor');
        this.container = document.getElementById('board-container');
        this.canvas = document.getElementById('board');
        this.context = this.canvas.getContext('2d');
        const board_image = new Image();
        board_image.src = 'balsa.jpg';
        window.addEventListener('resize', this.resize.bind(this));
        board_image.addEventListener('load', function() {
            console.log(this);
            this.texture = this.context.createPattern(board_image, 'repeat');
            this.draw();
        }.bind(this), false);
        this.setHangs();
        this.hangboard.active = [2, 5, 8, 12];
        this.resize();
    }

    resize() {
        console.log("resize called");
        this.canvas.width = this.container.offsetWidth;
        this.canvas.height = this.container.offsetHeight;
        this.draw();
    }

    get width() { return this.canvas.width; }
    get height() { return this.canvas.height; }

    draw() {
        console.log("draw called");
        this.context.clearRect(0,0,this.width,this.height);
        this.drawBoard();
        if(this.board_image) this.context.drawImage(this.board_image, 0, 0, this.width, this.height);
        this.drawHangs();
    }
    
    get margin() {
        return { x: this.border_ratio * this.width, y: this.border_ratio * this.height };
    }

    get padding() {
        return { x: this.padding_ratio * this.width, y: this.padding_ratio * this.height };
    }

    scale(hang) {
        const scale_x = this.width - 2 * this.margin.x;
        const scale_y = this.height - 2 * this.margin.y;
        return [
            hang.x * scale_x + this.padding.x + this.margin.x, 
            hang.y * scale_y + this.padding.y + this.margin.y, 
            hang.width * scale_x - 2 * this.padding.x, 
            hang.height * scale_y - 2 * this.padding.y
        ];
    }

    drawHangs() {
        console.log("drawHangs called");

        for(const [i, hang] of this.hangboard.hangs.entries()) {
            const rect = this.scale(hang);
            console.log(this.hangboard.active);
            if(this.hangboard.active.has(i)) {
                this.context.fillStyle = "rgba(0, 0, 255, 0.2)";
            } else {
                this.context.fillStyle = "rgba(0, 0, 0, 0.2)";
            }
            this.roundedRectFilled(...rect, this.padding.x*2);
            this.writeText(i, ...rect);
        }
    }

    writeText(text, x, y, w, h) {
        let font_height = h * 0.6;
        this.context.font = `${font_height}px Courier New`;
        let text_width = this.context.measureText(text).width;
        if( text_width > w * 0.8) {
            font_height *= w * 0.8 / text_width;
            this.context.font = `${font_height}px Courier New`;
            text_width = this.context.measureText(text).width;
        }
        this.context.fillStyle = 'rgba(0, 0, 0, 1)';
        this.context.fillText(text, w/2 + x - text_width/2, h/2 + y + font_height/4);
    }

    drawBoard() {
        this.context.fillStyle = this.texture;
        this.roundedRectFilled(0, 0, this.width, this.height, this.margin.x);
    }

    setHangs() {
        this.hangboard.update(this.editor.value);
        this.padding_ratio = 0.2 * 1/this.hangboard.size;
        this.draw();
    }

    roundedRectFilled(x,y,width,height,radius){
        this.context.beginPath();
        this.context.moveTo(x,y+radius);
        this.context.lineTo(x,y+height-radius);
        this.context.arcTo(x,y+height,x+radius,y+height,radius);
        this.context.lineTo(x+width-radius,y+height);
        this.context.arcTo(x+width,y+height,x+width,y+height-radius,radius);
        this.context.lineTo(x+width,y+radius);
        this.context.arcTo(x+width,y,x+width-radius,y,radius);
        this.context.lineTo(x+radius,y);
        this.context.arcTo(x,y,x,y+radius,radius);
        this.context.fill();
        this.context.stroke();
    }
};

let canvas;
let timer;

window.onload = function() {
    canvas = new Canvas();
    timer = new Timer('timer');
    timer.start(20);    
    console.log(canvas);
}


