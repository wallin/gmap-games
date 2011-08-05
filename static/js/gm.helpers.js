window.GM = window.GM || {};
GM.Helpers = GM.Helpers || {};


/****** Geo helpers ******/

//http://www.movable-type.co.uk/scripts/latlong.html
GM.Helpers.distanceBetweenPoints = function (p1, p2) {
  if (!p1 || !p2) {
    return 0;
  }

  var R = 6371; // Radius of the Earth in km
  var dLat = (p2.lat() - p1.lat()) * Math.PI / 180;
  var dLon = (p2.lng() - p1.lng()) * Math.PI / 180;
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(p1.lat() * Math.PI / 180) * Math.cos(p2.lat() * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c;
  return d;
};

// Simplest method for distance
// GM.Helpers.distanceBetweenPoints = function (p1, p2) {
//   return Math.abs(p1.lat() - p2.lat()) + Math.abs(p1.lng() - p2.lng());
// };


// Make a correct polyline from points
// http://w3.impa.br/~rdcastan/Cgeometry/
GM.Helpers.makeSimplePolyline = function (points) {
  // Find lowest point. Compare lat first, then lon
  var min = Infinity;
  var idx = 0;
  for (var i = 0; i < points.length; i++) {
    if ((points[i].pos.lat() < min) ||
       ((points[i].pos.lat() === min) &&
        (points[i].pos.lng() > points[idx].pos.lng()))) {
      min = points[i].pos.lat();
      idx = i;
    }
  }

  var p = points[idx];

  // Do radial sort agains lowest point
  return points.sort(function (a, b) {
    var dist_a = GM.Helpers.distanceBetweenPoints(a.pos, p.pos);
    var dist_b = GM.Helpers.distanceBetweenPoints(b.pos, p.pos);
    return dist_a - dist_b;
  });
};


// Melkmans O(n)
//http://softsurfer.com/Archive/algorithm_0203/algorithm_0203.htm
GM.Helpers.convexHullIsLeft = function (p0, p1, p2) {
  return (p1.pos.lat() - p0.pos.lat()) * (p2.pos.lng() - p0.pos.lng()) - (p2.pos.lat() - p0.pos.lat()) * (p1.pos.lng() - p0.pos.lng());
};

GM.Helpers.convexHull = function (points) {
  var t1 = new Date();
  var len = points.length;
  if (len < 3) {
    return;
  }

  // First make a valid simple polyline
  points = GM.Helpers.makeSimplePolyline(points);

  // Then apply Melkmans algorithm
  var isLeft = GM.Helpers.convexHullIsLeft;
  var rv = [];
  var dq = new Array(2 * len + 1);
  var bot = len - 2, top = bot + 3;

  dq[bot] = dq[top] = points[2];
  if (isLeft(points[0], points[1], points[2]) > 0) {
    dq[bot + 1] = points[0];
    dq[bot + 2] = points[1];
  }
  else {
    dq[bot + 1] = points[1];
    dq[bot + 2] = points[0];
  }

  for (var i = 3; i < len; i++) {
    if ((isLeft(dq[bot], dq[bot + 1], points[i]) > 0) &&
        (isLeft(dq[top - 1], dq[top], points[i]) > 0)) {
      continue;
    }
    while (isLeft(dq[bot], dq[bot + 1], points[i]) <= 0) {
      ++bot;
    }
    dq[--bot] = points[i];

    while (isLeft(dq[top - 1], dq[top], points[i]) <= 0) {
      --top;
    }
    dq[++top] = points[i];
  }

  for (var count = 0; count <= (top - bot); count++) {
    rv[count] = dq[bot + count].pos;
  }
  console.log('Calculated convex hull with ' + (count - 1) + ' on ' + len + ' points in ' + (new Date() - t1) + 'ms');
  return rv;
};
