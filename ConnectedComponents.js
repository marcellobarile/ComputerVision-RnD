var utils = new ImageUtils();
var self;

function ConnectedComponents() {
    self = this;
    this.points = [];
    this.labels = [];
    this.blobs = [];
    this.minPointsLen = 10;
    this.maxBlobsLen = 100;
    this.labelsCounter = 0;
    this.sourceImageData = null;
    this.cb = undefined;
    this.foreground = 0;
}
function reset() {
    this.points = [];
    this.labels = [];
    this.blobs = [];
    this.labelsCounter = 0;
}
function constructPointObj(x, y, color) {
    var condition;
    if (self.foreground == 0) {
        condition = (color.r == 0 || color.g == 0 || color.b == 0);
    } else {
        condition = (color.r != 0 || color.g != 0 || color.b != 0);
    }
    return {
        value: condition ? 1 : 0, // TODO: Check this, color should be configurable
        x: x,
        y: y,
        label: 0,
        color: color
    }
}
function createLabel() {
    var label = {
        id: self.labelsCounter++,
        color: utils.getRandomColor()
    };
    self.labels[self.labels.length] = label;
    return label;
}
function joinLabels(ida, idb) {
    var i = 0;
    for (i = 0, len = self.labels.length; i < len; i++) {
        if (self.labels[i].id == idb) {
            self.labels.splice(i, 1);
            break;
        }
    }
    for (i = 0, len = self.points.length; i < len; i++) {
        if (self.points[i].label == idb) {
            self.points[i].label = ida;
        }
    }
}
function getCentroid(pts) {
    return utils.getCentroid(pts);
}
function getBoundingBox(pts) {
    return utils.getBoundingBox(pts);
}
function extractBlobs(procId, showBlobs) {
    if (self.labels.length == 0) {
        // Empty
        return false;
    }
    for (var i = 0, ilen = self.labels.length; i < ilen; i++) {
        var pts = [];
        for (var j = 0, jlen = self.points.length; j < jlen; j++) {
            if (self.points[j].label == self.labels[i].id) {
                var pt = {
                    x: self.points[j].x,
                    y: self.points[j].y,
                    color: {
                        r: self.labels[i].color >> 16,
                        g: self.labels[i].color >> 8 & 255,
                        b: self.labels[i].color & 255,
                        a: 255
                    }
                };
                pts[pts.length] = pt;
                if (showBlobs) {
                    utils.setPixel(self.sourceImageData, pt.x, pt.y, pt.color.r, pt.color.g, pt.color.b, pt.color.a);
                }
            }
        }
        if (pts.length > self.minPointsLen && self.blobs.length < self.maxBlobsLen) {
            var blob = {
                proc_id: procId,
                id: i,
                bbox: getBoundingBox(pts),
                centroid: getCentroid(pts),
                points: pts
            };
            self.blobs[self.blobs.length] = blob;
            if (typeof self.cb === 'function') self.cb(blob);
        } else if (self.blobs.length >= self.maxBlobsLen) {
            // Complete
            return true;
        }
    }
    // Complete
    return true;
}
ConnectedComponents.prototype.segmentation = function(id, imageData, cb, endCb) {
    console.log('init segmentation');
    reset();
    this.cb = cb;
    this.sourceImageData = imageData;
    if (typeof imageData === 'undefined') throw new Error('The given image data is undefined');
    var w = imageData.width;
    var h = imageData.height;
    for (var x = 0; x < w; ++x) {
        for (var y = 0; y < h; ++y) {
            var ptCol = utils.getPixel(this.sourceImageData, x, y);
            var pt = constructPointObj(x, y, ptCol);
            if (pt.value == 1) {
                var ptr = this.getPoint(pt.x, pt.y - 1);
                var ptt = this.getPoint(pt.x - 1, pt.y);
                if (ptr.value == 0 && ptt.value == 0) {
                    createLabel();
                    pt.label = this.labelsCounter;
                } else if ((ptr.value == 1 && ptt.value == 0) || (ptt.value == 1 && ptr.value == 0)) {
                    pt.label = ptr.value == 1 ? ptr.label : ptt.label;
                } else if (ptr.value == 1 && ptt.value == 1) {
                    if (ptr.label != ptt.label) joinLabels(ptt.label, ptr.label);
                    pt.label = ptr.label;
                }
                this.points[this.points.length] = pt;
            }
        }
    }
    extractBlobs(id, true);
    endCb();
}
ConnectedComponents.prototype.getLabelColor = function(id) {
    for (var i = 0, len = this.labels.length; i < len; i++) {
        if (this.labels[i].id == id) {
            return this.labels[i].color;
        }
    }
    return 0;
}
ConnectedComponents.prototype.getPoint = function(x, y) {
    for (var i = 0, len = this.points.length; i < len; i++) {
        if (this.points[i].x == x && this.points[i].y == y) {
            return this.points[i];
        }
    }
    return {
        value: 0,
        label: 0,
        x: x,
        y: y,
        color: 0
    };
}