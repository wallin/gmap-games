/******************************************************************************/

GM.Clusterer = {};

/** Google marker manager */
GM.Clusterer.Google = function (map, markers, clusters) {
  this.map = map;
  this.markers = markers;
  this.clusters = clusters;
  this.lookup = {};
  this.gridSize = 120;
  this.createClusters();
};
GM.Clusterer.Google.prototype.createClusters = function () {
  var forceExisting = this.clusters != null;
  this.clusters = this.clusters || [];
  this.lookup = {};

  var mapBounds = new google.maps.LatLngBounds(this.map.map.getBounds().getSouthWest(),
                                               this.map.map.getBounds().getNorthEast());
  var bounds = this.getExtendedBounds(mapBounds);

  var t1 = new Date();

  for (var i = 0, marker; marker = this.markers[i]; i++) {
    if (!marker.isAdded && bounds.contains(marker.pos)) {
      this.addToClosestCluster(marker, forceExisting);
    }
  }

  GM.log('Created ' + this.clusters.length + ' clusters from ' + this.markers.length + ' markers in ' + (new Date() - t1) + 'ms');
};

// Create bounds extended to grid size
GM.Clusterer.Google.prototype.getExtendedBounds = function (bounds) {
  var projection = this.map.getProjection();

  // Turn the bounds into latlng.
  var tr = new google.maps.LatLng(bounds.getNorthEast().lat(),
      bounds.getNorthEast().lng());
  var bl = new google.maps.LatLng(bounds.getSouthWest().lat(),
      bounds.getSouthWest().lng());

  // Convert the points to pixels and the extend out by the grid size.
  var trPix = projection.fromLatLngToDivPixel(tr);
  trPix.x += this.gridSize;
  trPix.y -= this.gridSize;

  var blPix = projection.fromLatLngToDivPixel(bl);
  blPix.x -= this.gridSize;
  blPix.y += this.gridSize;

  // Convert the pixel points back to LatLng
  var ne = projection.fromDivPixelToLatLng(trPix);
  var sw = projection.fromDivPixelToLatLng(blPix);

  // Extend the bounds to contain the new bounds.
  bounds.extend(ne);
  bounds.extend(sw);

  return bounds;
};


GM.Clusterer.Google.prototype.addToClosestCluster = function (marker, force) {
  var distance = Infinity;
  var clusterToAddTo = null;
  var idx = 0;
  for (var i = 0, cluster; cluster = this.clusters[i]; i++) {
    var center = cluster.pos;
    if (center) {
      var d = GM.Helpers.distanceBetweenPoints(center, marker.pos);
      if (d < distance) {
        distance = d;
        idx = i;
        clusterToAddTo = cluster;
      }
    }
  }

  if (force || (clusterToAddTo && clusterToAddTo.isMarkerInClusterBounds(marker))) {
    clusterToAddTo.addMarker(marker);
  } else {
    idx = this.clusters.length;
    cluster = new GM.ThinCluster(this, idx, null, null, GM.CLUSTER_CLASS);
    cluster.addMarker(marker);
    this.clusters.push(cluster);
  }
  this.lookup[marker.id] = idx;
};

/** Simple K-means */
// https://engineering.purdue.edu/~milind/docs/rt08.pdf
// http://nlp.stanford.edu/IR-book/html/htmledition/hierarchical-agglomerative-clustering-1.html
// http://nlp.stanford.edu/IR-book/html/htmledition/cluster-cardinality-in-k-means-1.html#eqn:aicsimple
GM.Clusterer.KMeans = function (markers) {
  var clusters  = [];
  var vectors = [];
  var labels = [];
  _.each(markers, function (item) {
    vectors.push([item.pos.lat(), item.pos.lng()]);
    labels.push(item.id);
  });
  var t1 = new Date();
  var root = figue.kmeans(10, vectors);
  GM.log('K-means complete after: ' + (new Date() - t1));
  t1 = new Date();
  var id = 0;
  for (var i = 0, ii = root.centroids.length; i < ii; i++) {
    var item = root.centroids[i];
    clusters.push(
      new GM.ThinCluster(
        'cluster_' + (id++),
        new google.maps.LatLng(item[0], item[1]),
        null,
        GM.CLUSTER_CLASS
      )
    );
  }
  this.markers = markers;
  this.clusters = clusters;
  this.lookup = root.assignments;
};

