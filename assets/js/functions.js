/**
 * Calculate the bearing between two positions as a value from 0-360
 *
 * @param lat1 - The latitude of the first position
 * @param lng1 - The longitude of the first position
 * @param lat2 - The latitude of the second position
 * @param lng2 - The longitude of the second position
 *
 * @return int - The bearing between 0 and 360
 */
function bearing(lat1, lng1, lat2, lng2) {
    var dLon = this._toRad(lng2-lng1);
    var y = Math.sin(dLon) * Math.cos(this._toRad(lat2));
    var x = Math.cos(_toRad(lat1))*Math.sin(_toRad(lat2)) - Math.sin(_toRad(lat1))*Math.cos(_toRad(lat2))*Math.cos(dLon);
    var brng = _toDeg(Math.atan2(y, x));
    return ((brng + 360) % 360);
}

/**
 * Since not all browsers implement this we have our own utility that will
 * convert from degrees into radians
 *
 * @param deg - The degrees to be converted into radians
 * @return radians
 */
function _toRad(deg) {
    return deg * Math.PI / 180;
}

/**
 * Since not all browsers implement this we have our own utility that will
 * convert from radians into degrees
 *
 * @param rad - The radians to be converted into degrees
 * @return degrees
 */
function _toDeg(rad) {
    return rad * 180 / Math.PI;
}