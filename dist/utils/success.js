"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSuccess = exports.SuccessResponseBuilder = void 0;
// Success response builder class
class SuccessResponseBuilder {
    _message = 'Operation successful';
    _data;
    _meta;
    _statusCode = 200;
    constructor(message) {
        if (message) {
            this._message = message;
        }
    }
    static create(message) {
        return new SuccessResponseBuilder(message);
    }
    message(message) {
        this._message = message;
        return this;
    }
    data(data) {
        this._data = data;
        return this;
    }
    meta(meta) {
        this._meta = meta;
        return this;
    }
    pagination(page, limit, total) {
        const totalPages = Math.ceil(total / limit);
        this._meta = {
            ...this._meta,
            pagination: { page, limit, total, totalPages }
        };
        return this;
    }
    statusCode(code) {
        this._statusCode = code;
        return this;
    }
    send(res) {
        const response = {
            success: true,
            message: this._message,
            statusCode: this._statusCode
        };
        if (this._data !== undefined) {
            response.data = this._data;
        }
        if (this._meta) {
            response.meta = this._meta;
        }
        res.status(this._statusCode).json(response);
    }
}
exports.SuccessResponseBuilder = SuccessResponseBuilder;
// Quick success response functions
exports.sendSuccess = {
    // 200 - OK
    ok: (res, message, data, meta) => {
        SuccessResponseBuilder.create(message)
            .statusCode(200)
            .data(data)
            .meta(meta)
            .send(res);
    },
    // 201 - Created
    created: (res, message, data) => {
        SuccessResponseBuilder.create(message)
            .statusCode(201)
            .data(data)
            .send(res);
    }
};
