"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (streamParser) => {
    streamParser.on('data', (obj) => {
        var _a, _b, _c;
        if (obj.level !== 'error')
            return;
        console.log((_b = (_a = obj['err']) === null || _a === void 0 ? void 0 : _a.message) !== null && _b !== void 0 ? _b : obj['message']); // tslint:disable-line
        if ((_c = obj['err']) === null || _c === void 0 ? void 0 : _c.stack) { // tslint:disable-line
            console.log(`\n${obj['err'].stack}`); // tslint:disable-line
        }
    });
};
