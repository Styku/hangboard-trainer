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

    scaled_size(scale_x, scale_y, px, py) {
        return [this.x * scale_x + px, this.y * scale_y + py, this.width * scale_x - 2*px, this.height * scale_y - 2*py];
    }

    scaled_center(scale_x, scale_y) {
        return [(this.x + this.width/2) * scale_x, (this.y + this.height/2) * scale_y]
    }
}

class Hangboard {
    hangs = []

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

    get size() {
        return this.hangs.length;
    }
}

class Canvas {
    container;
    canvas;
    context;
    board_image;
    state;
    hangboard = new Hangboard();
    padding = 0.02;
    border = 0.1;
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

    drawHangs() {
        console.log("drawHangs called");
        const px = this.padding * this.width;
        const py = this.padding * this.height;
        const mx = this.border * this.width;
        const my = this.border * this.height;
        for(const [i, hang] of this.hangboard.hangs.entries()) {
            let rect = hang.scaled_size(this.width - 2*mx, this.height - 2*my, px, py);
            rect[0] += mx;
            rect[1] += my;
            roundedRect(this.context, ...rect, px*2);
            const center = hang.scaled_center(this.width-2*mx, this.height-2*my);
            center[0] += mx;
            center[1] += my;

            let font_height = rect[3]*0.6;
            this.context.font = `${font_height}px Courier New`;
            let text_width = this.context.measureText(i).width;
            if( text_width > rect[2]* 0.8) {
                font_height *= rect[2]* 0.8 / text_width;
                this.context.font = `${font_height}px Courier New`;
                text_width = this.context.measureText(i).width;
            }
            this.context.fillText(i, center[0] - text_width/2, center[1] + font_height/4);
        }
    }

    drawBoard() {
        roundedRect(this.context, 0, 0, this.width, this.height, 10);
        this.context.fillStyle = this.texture;
        this.context.fill();
    }

    setHangs() {
        this.hangboard.update(this.editor.value);
        this.padding = 0.2 * 1/this.hangboard.size;
        this.draw();
    }
};

function roundedRect(ctx,x,y,width,height,radius){
    ctx.beginPath();
    ctx.moveTo(x,y+radius);
    ctx.lineTo(x,y+height-radius);
    ctx.arcTo(x,y+height,x+radius,y+height,radius);
    ctx.lineTo(x+width-radius,y+height);
    ctx.arcTo(x+width,y+height,x+width,y+height-radius,radius);
    ctx.lineTo(x+width,y+radius);
    ctx.arcTo(x+width,y,x+width-radius,y,radius);
    ctx.lineTo(x+radius,y);
    ctx.arcTo(x,y,x,y+radius,radius);
    ctx.stroke();
}

let canvas;

window.onload = function() {
    canvas = new Canvas();
    console.log(canvas);
}


