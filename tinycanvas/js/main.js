var Shape = (function () {
  var inner = {};

  var Point = function (x, y) {
    this.getX = function () {
      return x;
    };
    this.getY = function () {
      return y;
    };
  };

  var StraightLine = function (startP, endP) {
    this.getStartPoint = function () {
      return startP;
    };
    this.getEndPoint = function () {
      return endP;
    };
  };

  var PathLine = function () {
    var pointList = [];
    this.addPoint = function (point) {
      if (point instanceof Point) {
        pointList.push(point);
      }
    };
    this.getPointList = function () {
      return pointList;
    };
  };

  var ScalableShape = function () {
    var scale = 1;

    this.getScale = function () {
      return scale;
    };
    this.zoomIn = function () {
      scale = scale * 2;
    };
    this.zoomOut = function () {
      scale = 0.5 * scale;
    };
  };

  var RotatableShape = function () {
    var angle = 0;

    this.getAngle = function () {
      return angle;
    };
    this.rotate = function () {
      angle = (angle + 90) % 360;
    };
    this.inShape = function (x, y) {
      var x1, x2, y1, y2;
      if (angle % 180 !== 0) {
        x1 = this.getStartX() + this.getWidth()/2 - this.getHeight() * this.getScale()/2;
        x2 = this.getStartX() + this.getWidth()/2 + this.getHeight() * this.getScale()/2;
        y1 = this.getStartY() + this.getHeight()/2 - this.getWidth() * this.getScale()/2;
        y2 = this.getStartY() + this.getHeight()/2 + this.getWidth() * this.getScale()/2;
      } else {
        x1 = this.getStartX() + this.getWidth()/2 - this.getWidth() * this.getScale()/2;
        x2 = this.getStartX() + this.getWidth()/2 + this.getWidth() * this.getScale()/2; ;
        y1 = this.getStartY() + this.getHeight()/2 - this.getHeight() * this.getScale()/2;
        y2 = this.getStartY() + this.getHeight()/2 + this.getHeight() * this.getScale()/2;;
      }
      return x > Math.min(x1, x2) && y > Math.min(y1, y2) && x < Math.max(x1, x2) && y < Math.max(y1, y2);
    };
  };

  var QuadBlockShape = function (x, y, w, h) {
    var startX = x, startY = y, width = w, height = h;

    this.getStartX = function () {
      return startX;
    };
    this.getStartY = function () {
      return startY;
    };
    this.getWidth = function () {
      return width;
    };
    this.getHeight = function () {
      return height;
    };
    this.translate = function (x, y) {
      startX = startX + x;
      startY = startY + y;
    };
    this.inShape = function (x, y) {
      return x > Math.min(startX, startX + width) && y > Math.min(startY, startY + height) &&
             x < Math.max(startX, startX + width) && y < Math.max(startY, startY + height);
    };
  };

  var Circle = function (x, y, radius) {
    var centerX = x, centerY = y;

    ScalableShape.call(this);

    this.getCenterX = function () {
      return centerX;
    };
    this.getCenterY = function () {
      return centerY;
    };
    this.getRadius = function () {
      return radius;
    };
    this.inShape = function (x, y) {
      var distance = Math.sqrt(Math.pow((x - centerX), 2) + Math.pow((y - centerY), 2));
      return distance < radius * this.getScale();
    };
    this.translate = function (x, y) {
      centerX = centerX + x;
      centerY = centerY + y;
    };
  };

  var Rectangle = function (x, y, width, height) {
    QuadBlockShape.call(this, x, y, width, height);
    ScalableShape.call(this);
    RotatableShape.call(this);
  };

  var Image = function (imageObj, x, y) {
    QuadBlockShape.call(this, x, y, imageObj.width, imageObj.height);
    ScalableShape.call(this);
    RotatableShape.call(this);

    this.getImageObj = function () {
      return imageObj;
    };
  };

  var ClipShape = function (imageData, x, y) {
    QuadBlockShape.call(this, x, y, imageData.width, imageData.height);

    this.getImageData = function () {
      return imageData;
    };
  };

  inner.Point = Point;
  inner.StraightLine = StraightLine;
  inner.PathLine = PathLine;
  inner.QuadBlockShape = QuadBlockShape;
  inner.Circle = Circle;
  inner.Rectangle = Rectangle;
  inner.Image = Image;
  inner.ClipShape = ClipShape;

  return inner;
})();

var myCanvas = (function (window, document, $, html) {
  var canvas, context, settings, rect, shapeStack;

  try {
    canvas = document.getElementById(html);
    context = canvas.getContext("2d");
    init();
  } catch (e) {
    document.getElementById("supportPrompt").innerHTML = "Browser not support.";
    return;
  }

  function init() {
    settings = {
      color: "#000",
      backgroundColor: "#fff",
      lineWidth: 1,
    };
    rect = canvas.getBoundingClientRect();
    shapeStack = [];
  }

  function getX(clientX) {
    return document.getElementById("canvasWrapper").scrollLeft + clientX - rect.left;
  }

  function getY(clientY) {
    return document.getElementById("canvasWrapper").scrollTop + clientY - rect.top;
  }

  function setColor(c) {
    settings.color = c;
  }

  function setLineWidth(w) {
    settings.lineWidth = w;
  }

  function clone(obj) {
    if(typeof obj !== "object" || obj === null) {
      return obj;
    }
    var copy = (obj instanceof Array) ? [] : {};
    for (attr in obj) {
      if(obj.hasOwnProperty(attr)) {
        copy[attr] = clone(obj[attr]);
      }
    }
    return copy;
  }

  var customDraw = function (currentSettings) {
    context.save();
    if (currentSettings.isFill) {
      context.fillStyle = currentSettings.color;
      context.fill();
    } else {
      context.strokeStyle = currentSettings.color;
      context.lineWidth = currentSettings.lineWidth;
      context.stroke();
    }
    context.restore();
  };

  var clearCanvas = function () {
    context.fillStyle = settings.backgroundColor;
    context.fillRect(0, 0, canvas.width, canvas.height);
  };

  var clearAll = function () {
    clearCanvas();
    shapeStack = [];
  }; 

  var repaintAll = function () {
    clearCanvas();
    for (var i = 0, len = shapeStack.length; i < len; i++) {
      var shape = shapeStack[i];
      if (shape instanceof Shape.PathLine) {
        drawPathLine(shape);
      } else if (shape instanceof Shape.StraightLine) {
        drawStraightLine(shape);
      } else if (shape instanceof Shape.Circle) {
        drawCircle(shape);
      } else if (shape instanceof Shape.Rectangle) {
        drawRect(shape);
      } else if (shape instanceof Shape.Image) {
        drawImage(shape);
      } else if (shape instanceof Shape.ClipShape) {
        drawClipShape(shape); 
      }
    }
  };

  var drawStraightLine = function (straightLine) {
    context.beginPath();
    context.moveTo(straightLine.getStartPoint().getX(), straightLine.getStartPoint().getY());
    context.lineTo(straightLine.getEndPoint().getX(), straightLine.getEndPoint().getY());
    customDraw(straightLine.style);
  };

  var drawPathLine = function (pathLine) {
    var pointList = pathLine.getPointList();
    if(pointList.length === 0) {
      return;
    }
    context.beginPath();
    context.moveTo(pointList[0].getX(), pointList[0].getY());
    for (var i = 0, len = pointList.length; i < len; i++) {
      context.lineTo(pointList[i].getX(), pointList[i].getY());
    }
    customDraw(pathLine.style);
  };

  var drawCircle = function (circle) {
    context.save();
    context.scale(circle.getScale(), circle.getScale());
    context.beginPath();
    context.arc(circle.getCenterX(), circle.getCenterY(), circle.getRadius(), 0, 2 * Math.PI);
    customDraw(circle.style);
    context.restore();
  };

  var drawRect = function (rect) {
    context.save();
    context.translate(rect.getStartX() + rect.getWidth() / 2, rect.getStartY() + rect.getHeight() / 2);
    context.rotate(rect.getAngle() * Math.PI / 180);
    context.scale(rect.getScale(), rect.getScale());
    context.beginPath();
    context.rect(-rect.getWidth()/2, -rect.getHeight()/2, rect.getWidth(), rect.getHeight());
    customDraw(rect.style);
    context.restore();
  };

  var drawImage = function (image) {
    context.save();
    context.translate(image.getStartX() + image.getWidth() / 2, image.getStartY() + image.getHeight() / 2);
    context.rotate(image.getAngle() * Math.PI / 180);
    context.scale(image.getScale(), image.getScale());
    var imageObj = image.getImageObj();
    context.drawImage(imageObj, -image.getWidth()/2, -image.getHeight()/2);
    context.restore();
  };

  var drawClipShape = function (clipShape) {
    context.save();
    context.putImageData(clipShape.getImageData(), clipShape.getStartX(), clipShape.getStartY());
    context.restore();
  };

  var switchToSelect = function () {
    var originX, originY, isPress = false;
    canvas.onmousedown = function (eva) {
      originX = getX(eva.clientX),
      originY = getY(eva.clientY);
      isPress = true;
      switchToSelect.activeShapeIndex = -1;
      for (var i = 0, len = shapeStack.length; i < len; i++) {
        var shape = shapeStack[i];
        if (shape.inShape !== undefined && shape.inShape(originX, originY)) {
          switchToSelect.activeShapeIndex = i;
        }
      }
    };
    canvas.onmousemove = function (eva) {
      if (!isPress || switchToSelect.activeShapeIndex < 0) {
        return;
      }
      canvas.style.cursor = "all-scroll";
      var newX = getX(eva.clientX),
          newY = getY(eva.clientY);
      shapeStack[switchToSelect.activeShapeIndex].translate(newX - originX, newY - originY);
      originX = newX;
      originY = newY;
      repaintAll();
    };
    canvas.onmouseup = function (eva) {
      if (!isPress || switchToSelect.activeShapeIndex < 0) {
        return;
      }
      var endX = getX(eva.clientX),
          endY = getY(eva.clientY);
      shapeStack[switchToSelect.activeShapeIndex].translate(endX - originX, endY - originY);
      repaintAll();
      canvas.style.cursor = "default";
      isPress = false;
    };
  };

  var switchToDrawPencil = function () {
    var pathLine = new Shape.PathLine(), isPress = false;
    canvas.onmousedown = function (eva) {
      var x = getX(eva.clientX);
      var y = getY(eva.clientY);
      pathLine.addPoint(new Shape.Point(x, y));
      isPress = true;
      context.beginPath();
      context.moveTo(x, y);
    };
    canvas.onmousemove = function (eva) {
      if(!isPress)
        return;
      var x = getX(eva.clientX);
      var y = getY(eva.clientY);
      pathLine.addPoint(new Shape.Point(x, y));
      context.lineTo(x, y);
      customDraw(settings);
    };
    canvas.onmouseup = function (eva) {
      isPress = false;
      pathLine.style = clone(settings);
      shapeStack.push(pathLine);
    };
  };

  var switchToDrawStraightLine = function () {
    var startX, startY, isPress = false;
    canvas.onmousedown = function (eva) {
      startX = getX(eva.clientX);
      startY = getY(eva.clientY);
      isPress = true;
    };
    canvas.onmousemove = function (eva) {
      if(!isPress)
        return;
      var x = getX(eva.clientX);
      var y = getY(eva.clientY);
      repaintAll();
      context.beginPath();
      context.moveTo(startX, startY);
      context.lineTo(x, y);
      customDraw(settings);
    };
    canvas.onmouseup = function (eva) {
      isPress = false;
      var endX = getX(eva.clientX);
      var endY = getY(eva.clientY);
      var straightLine = new Shape.StraightLine(new Shape.Point(startX, startY), new Shape.Point(endX, endY));
      straightLine.style = clone(settings);
      shapeStack.push(straightLine);
    };
  };

  var switchToDrawCircle = function () {
    var isPress = false, startX, startY;
    canvas.onmousedown = function (eva) {
      startX = getX(eva.clientX);
      startY = getY(eva.clientY);
      isPress = true;
    };
    canvas.onmousemove = function (eva) {
      if (!isPress) {
        return;
      }
      var x = getX(eva.clientX);
      var y = getY(eva.clientY);
      var centerX = (startX + x)/2;
      var centerY = (startY + y)/2;
      var radius = Math.sqrt(Math.pow((x - startX), 2) + Math.pow((y - startY), 2))/2;
      repaintAll();
      context.beginPath();
      context.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      customDraw(settings);
    };
    canvas.onmouseup = function (eva) {
      isPress = false;
      var endX = getX(eva.clientX);
      var endY = getY(eva.clientY);
      var centerX = (startX + endX)/2;
      var centerY = (startY + endY)/2;
      var radius = Math.sqrt(Math.pow((endX - startX), 2) + Math.pow((endY - startY), 2))/2;
      var circle = new Shape.Circle(centerX, centerY, radius);
      circle.style = clone(settings);
      shapeStack.push(circle);
    };
  };

  var switchToDrawRect = function () {
    var isPress = false, startX, startY;
    canvas.onmousedown = function (eva) {
      startX = getX(eva.clientX);
      startY = getY(eva.clientY);
      isPress = true;
    };
    canvas.onmousemove = function (eva) {
      if (!isPress) {
        return;
      }
      var x = getX(eva.clientX);
      var y = getY(eva.clientY);
      var width = x - startX;
      var height = y - startY;
      repaintAll();
      context.beginPath();
      context.rect(startX, startY, width, height);
      customDraw(settings);
    };
    canvas.onmouseup = function (eva) {
      isPress = false;
      var endX = getX(eva.clientX);
      var endY = getY(eva.clientY);
      var width = endX - startX;
      var height = endY - startY;
      var rect = new Shape.Rectangle(startX, startY, width, height);
      rect.style = clone(settings);
      shapeStack.push(rect);
    };
  };

  var addImage = function (image) {
    var url = window.URL || window.webkitURL;
    var src = url.createObjectURL(image);
    var imageObj = new Image();
    imageObj.onload = function () {
      context.drawImage(imageObj, 0, 0);
      var image = new Shape.Image(imageObj, 0, 0);
      image.style = settings;
      shapeStack.push(image);
      switchToSelect();
    };
    imageObj.src = src;
  };

  var switchToClip = function () {
    var isPress = false;
    switchToClip.canBeClip = false;
    canvas.style.cursor = "crosshair";
    canvas.onmousedown = function (eva) {
      switchToClip.startX = getX(eva.clientX);
      switchToClip.startY = getY(eva.clientY);
      isPress = true;
    };
    canvas.onmousemove = function (eva) {
      if (!isPress) {
        return;
      }
      var x = getX(eva.clientX);
      var y = getY(eva.clientY);
      var width = x - switchToClip.startX;
      var height = y - switchToClip.startY;
      repaintAll();
      context.save();
      context.fillStyle = "rgba(0, 0, 0, 0.5)";
      context.fillRect(switchToClip.startX, switchToClip.startY, width, height);
      context.restore();
    };
    canvas.onmouseup = function (eva) {
      isPress = false;
      var endX = getX(eva.clientX);
      var endY = getY(eva.clientY);
      switchToClip.width = endX - switchToClip.startX;
      switchToClip.height = endY - switchToClip.startY;
      switchToClip.canBeClip = true;
    };
  };

  var confirmClip = function () {
    if (switchToClip.canBeClip) {
      repaintAll();
      canvas.style.cursor = "default";
      var imageData = context.getImageData(switchToClip.startX, switchToClip.startY, switchToClip.width, switchToClip.height);
      clearCanvas();
      context.putImageData(imageData, switchToClip.startX, switchToClip.startY);
      shapeStack = [];
      var clipShape = new Shape.ClipShape(imageData, switchToClip.startX, switchToClip.startY);
      shapeStack.push(clipShape);
      switchToClip.canBeClip = false;
      switchToSelect();
    }
  };

  var rotate = function () {
    var shape = shapeStack[switchToSelect.activeShapeIndex];
    if (shape instanceof Shape.Rectangle || shape instanceof Shape.Image) {
      shapeStack[switchToSelect.activeShapeIndex].rotate();
      repaintAll();
    } else {
      alert("Please select a shap.");
    }
  };

  var zoomIn = function () {
    var shape = shapeStack[switchToSelect.activeShapeIndex];
    if (shape instanceof Shape.Circle || shape instanceof Shape.Rectangle || shape instanceof Shape.Image) {
      shapeStack[switchToSelect.activeShapeIndex].zoomIn();
      repaintAll();
    } else {
      alert("Please select a shap.");
    }
  };

  var zoomOut = function () {
    var shape = shapeStack[switchToSelect.activeShapeIndex];
    if (shape instanceof Shape.Circle || shape instanceof Shape.Rectangle || shape instanceof Shape.Image) {
      shapeStack[switchToSelect.activeShapeIndex].zoomOut();
      repaintAll();
    } else {
      alert("Please select a shap.");
    }
  };

  var switchToFillShape = function () {
    var activeShapeIndex;
    canvas.onmousedown = function (eva) {
      if (activeShapeIndex > -1) {
        shapeStack[activeShapeIndex].style = clone(settings);
        shapeStack[activeShapeIndex].style.isFill = true;
        repaintAll();
      }
    };
    canvas.onmousemove = function (eva) {
      var x = getX(eva.clientX),
          y = getY(eva.clientY);
      activeShapeIndex = -1;
      for (var i = 0, len = shapeStack.length; i < len; i++) {
        var shape = shapeStack[i];
        if ((shape instanceof Shape.Circle || shape instanceof Shape.Rectangle) && shape.inShape(x, y)) {
          activeShapeIndex = i;
        }
      }
    };
    canvas.onmouseup = null;
  };

  var interface = {
    switchToSelect: switchToSelect,
    switchToDrawPencil: switchToDrawPencil,
    switchToDrawStraightLine: switchToDrawStraightLine,
    switchToDrawCircle: switchToDrawCircle,
    switchToDrawRect: switchToDrawRect,
    addImage: addImage,
    switchToClip: switchToClip,
    confirmClip: confirmClip,
    rotate: rotate,
    zoomIn: zoomIn,
    zoomOut: zoomOut,
    switchToFillShape: switchToFillShape,
    clearAll: clearAll,
    setColor: setColor,
    setLineWidth: setLineWidth,
  };

  return interface;
})(window, document, jQuery, "myCanvas");

$(document).ready(function () {
  document.getElementById("selectBtn").onclick = myCanvas.switchToSelect;
  document.getElementById("pencilBtn").onclick = myCanvas.switchToDrawPencil;
  document.getElementById("straightLineBtn").onclick = myCanvas.switchToDrawStraightLine;
  document.getElementById("circleBtn").onclick = myCanvas.switchToDrawCircle;
  document.getElementById("rectBtn").onclick = myCanvas.switchToDrawRect;
  document.getElementById("addImageBtn").onclick = function () {
    var files = document.getElementById("fileHolder").files;
    for (var i = 0, len = files.length; i < len; i++) {
      myCanvas.addImage(files[i]);
    }
  };
  document.getElementById("clipBtn").onclick = myCanvas.switchToClip;
  document.getElementById("confirmClipBtn").onclick = myCanvas.confirmClip;
  document.getElementById("rotateBtn").onclick = myCanvas.rotate;
  document.getElementById("zoomInBtn").onclick = myCanvas.zoomIn;
  document.getElementById("zoomOutBtn").onclick = myCanvas.zoomOut;
  document.getElementById("fillBtn").onclick = myCanvas.switchToFillShape;
  document.getElementById("clearAllBtn").onclick = myCanvas.clearAll;
  $("#colorPicker").bigColorpicker(function(el,color){
    $(el).css("backgroundColor",color);
    myCanvas.setColor(color);
  }, "L");
  $("#lineWidthSelector").change(function () {
    myCanvas.setLineWidth(this.value);
  });
});
