function appear(idDiv, callback) {
  var div = document.getElementById(idDiv).style;
  var i = 0;
  var f = function() {
    div.opacity = i;
    i = i+0.02;
    if(i<=1) {
      setTimeout(f,30);
    }
    else {
      callback();
    }
  };
  f();
}

function disappear(idDiv) {
  var div = document.getElementById(idDiv).style;
  var i = 1;
  var f = function() {
    div.opacity = i;
    i = i-0.02;
    if(i>=0) {
      setTimeout(f,30);
    }
  };
  f();
}
