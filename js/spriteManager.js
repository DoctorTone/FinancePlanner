/**
 * Created by atg on 28/01/2015.
 */
//Manage all the labels (sprites) for the website

var spriteManager = (function () {
    //Default values
    var defaultFontFace = "Arial";
    var defaultBorderThickness = 5;
    var backgroundColour = 'rgba(55, 55, 55, 1.0)';
    var borderColour = 'rgba(0, 0, 0, 1.0)';
    var textColour = 'rgba(255, 184, 57, 1.0)';
    var defaultFontSize = 24;
    var defaultVisibility = false;
    var defaultRadius = 20;
    var canvasWidth = 400;
    var currentFontSize;

    var labels = [];
    var labelNames = [];

    return {
        create: function(name, position, scale, fontSize, opacity, visible, rect) {
            //Create label
            currentFontSize = fontSize;
            var canvas = document.createElement('canvas');
            var spriteName = ' ' + name + ' ';
            canvas.width = canvasWidth;

            var context = canvas.getContext('2d');
            context.font = fontSize + "px " + defaultFontFace;


            var metrics = context.measureText( spriteName );
            var textWidth = metrics.width;

            //Background
            context.fillStyle = backgroundColour;
            //Border
            context.strokeStyle = borderColour;
            context.lineWidth = defaultBorderThickness;

            //Draw rounded rectangle
            //Position text in centre of canvas
            var offset = (canvas.width - (textWidth + defaultBorderThickness))/2;
            if(rect) {
                roundRect(context, offset, defaultBorderThickness/2, defaultBorderThickness/2, textWidth + defaultBorderThickness, fontSize * 1.4 + defaultBorderThickness, defaultRadius);
            }

            //Text
            context.fillStyle = textColour;
            context.fillText( spriteName, defaultBorderThickness + offset, fontSize + defaultBorderThickness);

            // canvas contents will be used for a texture
            var texture = new THREE.Texture(canvas);
            texture.minFilter = THREE.LinearFilter;
            texture.needsUpdate = true;


            //texture.needsUpdate = true;
            var spriteMaterial = new THREE.SpriteMaterial({
                    transparent: false,
                    opacity: opacity,
                    map: texture}
            );

            var sprite = new THREE.Sprite(spriteMaterial);
            labels.push(sprite);
            sprite.index = labels.length-1;
            sprite.name = name + 'Label';
            labelNames.push(name);
            sprite.visible = visible;

            //var offset = (canvas.width - textWidth) / 80;
            sprite.position.set(position.x, position.y, position.z);
            sprite.scale.set(scale.x, scale.y, 1);

            return sprite;
        },

        setBorderProperties: function(thickNess, colour) {
            defaultBorderThickness = thickNess != undefined ? thickNess : defaultBorderThickness;
            borderColour = colour != undefined ? 'rgba('+colour.r+','+colour.g+','+colour.b+','+colour.a+')' : borderColour;
        },

        setBorderColour: function(colour) {
            if(colour != undefined) {
                var red = Math.round(colour[0]);
                var green = Math.round(colour[1]);
                var blue = Math.round(colour[2]);

                borderColour = "rgba(" + red + "," + green + "," + blue + "," + "1.0)";
            }
        },

        setBackgroundColour: function(colour) {
            if(colour != undefined) {
                var red = Math.round(colour[0]);
                var green = Math.round(colour[1]);
                var blue = Math.round(colour[2]);

                backgroundColour = "rgba(" + red + "," + green + "," + blue + "," + "1.0)";
            }
        },

        setTextColour: function(colour) {
            if(colour != undefined) {
                var red = Math.round(colour[0]);
                var green = Math.round(colour[1]);
                var blue = Math.round(colour[2]);

                textColour = "rgba(" + red + "," + green + "," + blue + "," + "1.0)";
            }
        },

        getSprite: function(name) {
            for(var i=0; i<labelNames.length; ++i) {
                if(labelNames[i] === name) {
                    return labels[i];
                }
            }

            return null;
        },

        getSpriteByIndex: function(index) {
            for(var i=0; i<labels.length; ++i) {
                if(labels[i].index === index) {
                    return labels[i];
                }
            }

            return null;
        },

        setText: function(sprite, text) {
            for(var i=0; i<labels.length; ++i) {
                if(labels[i] === sprite) {
                    break;
                }
            }
            var canvas = labels[i].material.map.image;
            var context = canvas.getContext('2d');
            var metrics = context.measureText( text );
            var textWidth = metrics.width;
            var offset = (canvasWidth - (textWidth + defaultBorderThickness))/2;

            context.clearRect(0, 0, canvas.width, canvas.height);
            context.fillText(text, defaultBorderThickness + offset, currentFontSize + defaultBorderThickness);
            labels[i].material.map.needsUpdate = true;
        },

        setTextAmount: function(sprite, text) {
            for(var i=0; i<labels.length; ++i) {
                if(labels[i] === sprite) {
                    break;
                }
            }
            var amount = text.toFixed(2);
            amount = '£'+amount;
            var canvas = labels[i].material.map.image;
            var context = canvas.getContext('2d');
            var metrics = context.measureText( amount );
            var textWidth = metrics.width;
            var offset = (canvasWidth - (textWidth + defaultBorderThickness))/2;

            context.clearRect(0, 0, canvas.width, canvas.height);
            context.fillText(amount, defaultBorderThickness + offset, currentFontSize + defaultBorderThickness);
            labels[i].material.map.needsUpdate = true;
        }
    };
})();

// function for drawing rounded rectangles
function roundRect(ctx, offset, x, y, w, h, r)
{
    x += offset;
    ctx.beginPath();
    ctx.moveTo(x+r, y);
    ctx.lineTo(x+w-r, y);
    ctx.quadraticCurveTo(x+w, y, x+w, y+r);
    ctx.lineTo(x+w, y+h-r);
    ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
    ctx.lineTo(x+r, y+h);
    ctx.quadraticCurveTo(x, y+h, x, y+h-r);
    ctx.lineTo(x, y+r);
    ctx.quadraticCurveTo(x, y, x+r, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
}
