"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ioredis_1 = __importDefault(require("ioredis"));
class RedisClient {
    constructor() {
        this.client = new ioredis_1.default();
    }
    set(key, value) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.client.set(key, value);
        });
    }
    get(key) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.client.get(key);
        });
    }
    rpush(key, value) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("key-------->", key);
            console.log("value---------------->", value);
            yield this.client.rpush(key, value);
        });
    }
    lpop(key) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.client.lpop(key);
        });
    }
    keys(pattern) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.client.keys(pattern);
        });
    }
    del(key) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.client.del(key);
        });
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.client.connect();
        });
    }
    reconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.client.disconnect();
            yield this.connect();
        });
    }
}
exports.default = new RedisClient();
