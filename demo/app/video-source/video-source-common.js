var utils = require("utils/utils");
// This is used for definition purposes only, it does not generate JavaScript for it.
var definition = require("./video-source");
function fromResource(name) {
    var image = new definition.VideoSource();
    return image.loadFromResource(name) ? image : null;
}
exports.fromResource = fromResource;
function fromFile(path) {
    var image = new definition.VideoSource();
    return image.loadFromFile(path) ? image : null;
}
exports.fromFile = fromFile;
function fromNativeSource(source) {
    var image = new definition.VideoSource();
    return image.setNativeSource(source) ? image : null;
}
exports.fromNativeSource = fromNativeSource;
function fromUrl(url) {
    var http = require("http");
    return http.getImage(url);
}
exports.fromUrl = fromUrl;
function fromFileOrResource(path) {
    if (!isFileOrResourcePath(path)) {
        throw new Error("Path \"" + "\" is not a valid file or resource.");
    }
    if (path.indexOf(utils.RESOURCE_PREFIX) === 0) {
        return fromResource(path.substr(utils.RESOURCE_PREFIX.length));
    }
    return fromFile(path);
}
exports.fromFileOrResource = fromFileOrResource;
function isFileOrResourcePath(path) {
    return utils.isFileOrResourcePath(path);
}
exports.isFileOrResourcePath = isFileOrResourcePath;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlkZW8tc291cmNlLWNvbW1vbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInZpZGVvLXNvdXJjZS1jb21tb24udHMiXSwibmFtZXMiOlsiZnJvbVJlc291cmNlIiwiZnJvbUZpbGUiLCJmcm9tTmF0aXZlU291cmNlIiwiZnJvbVVybCIsImZyb21GaWxlT3JSZXNvdXJjZSIsImlzRmlsZU9yUmVzb3VyY2VQYXRoIl0sIm1hcHBpbmdzIjoiQUFBQSxJQUFPLEtBQUssV0FBVyxhQUFhLENBQUMsQ0FBQztBQUd0QyxxRkFBcUY7QUFDckYsSUFBTyxVQUFVLFdBQVcsZ0JBQWdCLENBQUMsQ0FBQztBQUU5QyxzQkFBNkIsSUFBWTtJQUNyQ0EsSUFBSUEsS0FBS0EsR0FBR0EsSUFBSUEsVUFBVUEsQ0FBQ0EsV0FBV0EsRUFBRUEsQ0FBQ0E7SUFDekNBLE1BQU1BLENBQUNBLEtBQUtBLENBQUNBLGdCQUFnQkEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsR0FBR0EsS0FBS0EsR0FBR0EsSUFBSUEsQ0FBQ0E7QUFDdkRBLENBQUNBO0FBSGUsb0JBQVksZUFHM0IsQ0FBQTtBQUVELGtCQUF5QixJQUFZO0lBQ2pDQyxJQUFJQSxLQUFLQSxHQUFHQSxJQUFJQSxVQUFVQSxDQUFDQSxXQUFXQSxFQUFFQSxDQUFDQTtJQUN6Q0EsTUFBTUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsWUFBWUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsR0FBR0EsS0FBS0EsR0FBR0EsSUFBSUEsQ0FBQ0E7QUFDbkRBLENBQUNBO0FBSGUsZ0JBQVEsV0FHdkIsQ0FBQTtBQUdELDBCQUFpQyxNQUFXO0lBQ3hDQyxJQUFJQSxLQUFLQSxHQUFHQSxJQUFJQSxVQUFVQSxDQUFDQSxXQUFXQSxFQUFFQSxDQUFDQTtJQUN6Q0EsTUFBTUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsZUFBZUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsR0FBR0EsS0FBS0EsR0FBR0EsSUFBSUEsQ0FBQ0E7QUFDeERBLENBQUNBO0FBSGUsd0JBQWdCLG1CQUcvQixDQUFBO0FBRUQsaUJBQXdCLEdBQVc7SUFDL0JDLElBQUlBLElBQUlBLEdBQXNCQSxPQUFPQSxDQUFDQSxNQUFNQSxDQUFDQSxDQUFDQTtJQUU5Q0EsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7QUFDOUJBLENBQUNBO0FBSmUsZUFBTyxVQUl0QixDQUFBO0FBRUQsNEJBQW1DLElBQVk7SUFDM0NDLEVBQUVBLENBQUNBLENBQUNBLENBQUNBLG9CQUFvQkEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7UUFDOUJBLE1BQU1BLElBQUlBLEtBQUtBLENBQUNBLFNBQVNBLEdBQUdBLHFDQUFxQ0EsQ0FBQ0EsQ0FBQ0E7SUFDdkVBLENBQUNBO0lBRURBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLE9BQU9BLENBQUNBLEtBQUtBLENBQUNBLGVBQWVBLENBQUNBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO1FBQzVDQSxNQUFNQSxDQUFDQSxZQUFZQSxDQUFDQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxLQUFLQSxDQUFDQSxlQUFlQSxDQUFDQSxNQUFNQSxDQUFDQSxDQUFDQSxDQUFDQTtJQUNuRUEsQ0FBQ0E7SUFDREEsTUFBTUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7QUFDMUJBLENBQUNBO0FBVGUsMEJBQWtCLHFCQVNqQyxDQUFBO0FBRUQsOEJBQXFDLElBQVk7SUFDN0NDLE1BQU1BLENBQUNBLEtBQUtBLENBQUNBLG9CQUFvQkEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7QUFDNUNBLENBQUNBO0FBRmUsNEJBQW9CLHVCQUVuQyxDQUFBIn0=