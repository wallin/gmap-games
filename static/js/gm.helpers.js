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

GM.Helpers.leftMostIndex = function(points) {
  var i, idx, lat, lng, min, p, _i, _len;
  min = Infinity;
  idx = 0;
  for (i = _i = 0, _len = points.length; _i < _len; i = ++_i) {
    p = points[i];
    lat = p.pos.lat();
    lng = p.pos.lng();
    if (lat < min || (lat === min && lng < points[idx].pos.lng())) {
      min = lat;
      idx = i;
    }
  }
  return idx;
};

GM.Helpers.convexHullIsLeft = function (p0, p1, p2) {
  return (p1.lat() - p0.lat()) * (p2.lng() - p0.lng()) - (p2.lat() - p0.lat()) * (p1.lng() - p0.lng());
};

// Jarvis march gift wrapping algo
GM.Helpers.convexHull = function(points) {
    var endPoint, hull, idx, isLeft, p, pointOnHull, _i, _len;
    if (points.length < 3) {
      return null;
    }
    idx = GM.Helpers.leftMostIndex(points);
    isLeft = GM.Helpers.convexHullIsLeft;
    pointOnHull = points[idx].pos;
    hull = [];
    while (true) {
      hull.push(pointOnHull);
      endPoint = points[0].pos;
      for (_i = 0, _len = points.length; _i < _len; _i++) {
        p = points[_i];
        if (endPoint.equals(pointOnHull) || isLeft(pointOnHull, endPoint, p.pos) > 0) {
          endPoint = p.pos;
        }
      }
      pointOnHull = endPoint;
      if (endPoint.equals(hull[0])) {
        break;
      }
    }
    return hull;
  };
