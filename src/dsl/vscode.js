"use strict";
exports.__esModule = true;
exports.Uri = exports.Range = exports.Position = void 0;
var Position = /** @class */ (function () {
    function Position(line, character) {
        this.line = line;
        this.character = character;
    }
    Position.prototype.compareTo = function (other) {
        var l = this.line - other.line;
        if (l !== 0) {
            return Math.sign(l);
        }
        else {
            var c = this.character - other.character;
            return Math.sign(c);
        }
    };
    Position.prototype.isAfter = function (other) { return this.compareTo(other) > 0; };
    Position.prototype.isAfterOrEqual = function (other) { return this.compareTo(other) >= 0; };
    Position.prototype.isBefore = function (other) { return this.compareTo(other) < 0; };
    Position.prototype.isBeforeOrEqual = function (other) { return this.compareTo(other) <= 0; };
    Position.prototype.isEqual = function (other) { return this.compareTo(other) === 0; };
    Position.prototype.translate = function (lineDelta, characterDelta) {
        return new Position(this.line + (lineDelta || 0), this.character + (characterDelta || 0));
    };
    Position.prototype["with"] = function (line, character) {
        if (typeof line === 'number') {
            return new Position(line || this.line, character || this.character);
        }
        else if (typeof line === 'object' && character === undefined) {
            return new Position(line.line || this.line, line.character || this.character);
        }
    };
    return Position;
}());
exports.Position = Position;
var Range = /** @class */ (function () {
    function Range(s, e, endLine, endCharacter) {
        var p1, p2;
        if (typeof s === 'number' && typeof e === 'number' && endLine !== undefined && endCharacter !== undefined) {
            p1 = new Position(s, e);
            p2 = new Position(endLine, endCharacter);
        }
        else if (typeof s === 'object' && typeof e === 'object' && endLine === undefined && endCharacter === undefined) {
            p1 = s;
            p2 = e;
        }
        else {
            throw new Error('Invalid constructor used for Range');
        }
        var swap = p1.isAfter(p2);
        this.start = swap ? p2 : p1;
        this.end = swap ? p1 : p2;
        this.isSingleLine = p1.line === p2.line;
        this.isEmpty = p1.isEqual(p2);
    }
    Range.prototype.contains = function (positionOrRange) {
        var _this = this;
        var pos = [];
        if (positionOrRange instanceof Range) {
            pos = [positionOrRange.start, positionOrRange.end];
        }
        else {
            pos = [positionOrRange];
        }
        return pos.every(function (p) { return p.isAfterOrEqual(_this.start) && p.isBeforeOrEqual(_this.end); });
    };
    Range.prototype.intersection = function (range) {
        if (range.contains(this.start) || range.contains(this.end) || this.contains(range.start) || this.contains(range.end)) {
            var s = this.start.isAfter(range.start) ? this.start : range.start;
            var e = this.end.isBefore(range.end) ? this.end : range.end;
            return new Range(s, e);
        }
        else {
            return undefined;
        }
    };
    Range.prototype.isEqual = function (other) {
        return this.start.isEqual(other.start) && this.end.isEqual(other.end);
    };
    Range.prototype.union = function (other) {
        var s = this.start.isBefore(other.start) ? this.start : other.start;
        var e = this.end.isAfter(other.end) ? this.end : other.end;
        return new Range(s, e);
    };
    Range.prototype["with"] = function (start, end) {
        return new Range(start || this.start, end || this.end);
    };
    return Range;
}());
exports.Range = Range;
var Uri = /** @class */ (function () {
    function Uri(scheme, authority, path, query, fragment) {
        this.scheme = scheme;
        this.authority = authority;
        this.path = path;
        this.query = query;
        this.fragment = fragment;
        this.fsPath = path; // We don't do conversions of Windows paths like VSCode does
    }
    Uri.file = function (path) {
        return new Uri('file', '', path, '', '');
    };
    Uri.from = function (components) {
        return new Uri(components.scheme, components.authority, components.path, components.query, components.fragment);
    };
    Uri.joinPath = function (base) {
        var pathSegments = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            pathSegments[_i - 1] = arguments[_i];
        }
        // dummy implementation for now
        return new Uri(base.scheme, base.authority, base.path + pathSegments.join('/'), base.query, base.fragment);
    };
    Uri.parse = function (value, strict) {
        // We assume strict to always be `true`
        var m = value.match(/([a-z]+):\/\/([^/?#]*)([^?#]*)(?:\?([^#]+))?(?:#(.+))?/);
        if (m) {
            return new Uri(m[1], m[2], m[3] || '/', m[4], m[5]);
        }
        else {
            throw new Error("Unable to parse Uri from string ".concat(value));
        }
    };
    Uri.prototype.toJSON = function () {
        return {
            authority: this.authority,
            fragment: this.fragment,
            fsPath: this.fsPath,
            path: this.path,
            query: this.query,
            scheme: this.scheme
        };
    };
    Uri.prototype.toString = function (skipEncoding) {
        var _a, _b;
        var s = "".concat(this.scheme, "://").concat(this.authority).concat(this.path);
        if ((_a = this.query) === null || _a === void 0 ? void 0 : _a.length) {
            s += '?' + this.query;
        }
        if ((_b = this.fragment) === null || _b === void 0 ? void 0 : _b.length) {
            s += '#' + this.fragment;
        }
        return s;
    };
    Uri.prototype["with"] = function (change) {
        return new Uri(change.scheme || this.scheme, change.authority || this.authority, change.path || this.path, change.query || this.query, change.fragment || this.fragment);
    };
    return Uri;
}());
exports.Uri = Uri;
