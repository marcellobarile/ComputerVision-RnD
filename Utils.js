// http://www.html5rocks.com/en/tutorials/canvas/imagefilters/#toc-simplefilters
function ImageUtils() {}
ImageUtils.prototype.convolute = function(imageData, weights, opaque) {
    var side = Math.round(Math.sqrt(weights.length));
    var halfSide = Math.floor(side / 2);
    var src = imageData.data;
    var sw = imageData.width;
    var sh = imageData.height;
    // pad output by the convolution matrix
    var w = sw;
    var h = sh;
    // go through the destination image pixels
    var alphaFac = opaque ? 1 : 0;
    for (var y = 0; y < h; y++) {
        for (var x = 0; x < w; x++) {
            var sy = y;
            var sx = x;
            var dstOff = (y * w + x) * 4;
            // calculate the weighed sum of the source image pixels that
            // fall under the convolution matrix
            var r = 0,
                g = 0,
                b = 0,
                a = 0;
            for (var cy = 0; cy < side; cy++) {
                for (var cx = 0; cx < side; cx++) {
                    var scy = sy + cy - halfSide;
                    var scx = sx + cx - halfSide;
                    if (scy >= 0 && scy < sh && scx >= 0 && scx < sw) {
                        var srcOff = (scy * sw + scx) * 4;
                        var wt = weights[cy * side + cx];
                        r += src[srcOff] * wt;
                        g += src[srcOff + 1] * wt;
                        b += src[srcOff + 2] * wt;
                        a += src[srcOff + 3] * wt;
                    }
                }
            }
            src[dstOff] = r;
            src[dstOff + 1] = g;
            src[dstOff + 2] = b;
            src[dstOff + 3] = a + alphaFac * (255 - a);
        }
    }
    return imageData;
};
ImageUtils.prototype.blur = function(imageData, amount) {
    return this.convolute(imageData, [amount, amount, amount,
        amount, amount, amount,
        amount, amount, amount
    ]);
};
// Note: the threshold will convert to B/N (binary) automatically
ImageUtils.prototype.threshold = function(imageData, threshold) {
    var d = imageData.data;
    for (var i = 0, len = d.length; i < len; i += 4) {
        var r = d[i],
            g = d[i + 1],
            b = d[i + 2],
            v = (0.2126 * r + 0.7152 * g + 0.0722 * b >= threshold) ? 255 : 0;
        d[i] = d[i + 1] = d[i + 2] = v;
    }
    return imageData;
};
ImageUtils.prototype.reduce = function(imageData, trackColor) {
    var d = imageData.data;
    for (var i = 0, len = d.length; i < len; i += 4) {
        var rc = this.reduceColor({
            r: d[i],
            g: d[i + 1],
            b: d[i + 2]
        }, 128);
        // TODO: This condition could be not working for all the colours
        if (((rc.r == trackColor.r && rc.b == trackColor.b) && (rc.g >= 0 && rc.g <= trackColor.g)) || typeof trackColor === 'undefined') {
            d[i] = rc.r;
            d[i + 1] = rc.g;
            d[i + 2] = rc.b;
        } else {
            // TODO: Use a customizable color for the background
            d[i] = 0;
            d[i + 1] = 0;
            d[i + 2] = 0;
        }
    }
    return imageData;
};
ImageUtils.prototype.reduceColor = function(color, valueReduction) {
    if (typeof valueReduction === 'undefined') valueReduction = 128;
    return {
        r: color.r - (color.r % valueReduction),
        g: color.g - (color.g % valueReduction),
        b: color.b - (color.b % valueReduction)
    };
};
ImageUtils.prototype.skinExtractor = function(threshold) {
    // TODO
};
ImageUtils.prototype.setImageData = function(context, imageData) {
    context.putImageData(imageData, 0, 0);
};
ImageUtils.prototype.getPixelsData = function(imageData) {
    return imageData.data;
};
ImageUtils.prototype.getPixel = function(imageData, x, y, debug) {
    var i = this.getImageDataIndex(imageData.width, x, y, imageData.data.length);
    return {
        r: imageData.data[i],
        g: imageData.data[i + 1],
        b: imageData.data[i + 2],
        a: imageData.data[i + 3]
    };
};
ImageUtils.prototype.setPixel = function(imageData, x, y, r, g, b, a) {
    if (typeof imageData !== 'undefined') {
        var i = this.getImageDataIndex(imageData.width, x, y, imageData.data.length);
        imageData.data[i] = r;
        imageData.data[i + 1] = g;
        imageData.data[i + 2] = b;
        imageData.data[i + 3] = a;
    }
};
ImageUtils.prototype.getImageDataIndex = function(width, x, y, length) {
    return Math.floor((y * width + x) * 4);
};
ImageUtils.prototype.getColorInt = function(oColor) {
    return ((oColor.r & 0x0ff) << 16) | ((oColor.g & 0x0ff) << 8) | (oColor.b & 0x0ff);
};
ImageUtils.prototype.getRandomColor = function() {
    return Math.round(0xffffff * Math.random());
};
ImageUtils.prototype.copyImageData = function(oldCanvas) {
    // TODO
};
ImageUtils.prototype.getCentroid = function(set) {
    var sumX = sumY = 0;
    for (var i = 0,len=set.length; i < len; i++) {
        sumX += set[i].x;
        sumY += set[i].y;
    }
    return {
        x: sumX / len,
        y: sumY / len
    }
}
ImageUtils.prototype.getBoundingBox = function(set) {
    var minX = maxX = minY = maxY = -1;
    for (var i = 0, len=set.length; i < len; i++) {
        var pt = set[i];
        var x = pt.x;
        var y = pt.y;
        if (x < minX || minX < 0) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY || minY < 0) minY = y;
        if (y > maxY) maxY = y;
    }
    return {
        x: minX,
        y: minY,
        width: Math.abs(minX - maxX),
        height: Math.abs(minY - maxY)
    }
}