"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyGoogleIdToken = void 0;
const google_auth_library_1 = require("google-auth-library");
const client = new google_auth_library_1.OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const verifyGoogleIdToken = async (idToken) => {
    try {
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        const payload = ticket.getPayload();
        if (!payload) {
            throw new Error('Invalid Google ID token');
        }
        return {
            sub: payload.sub,
            email: payload.email,
            email_verified: payload.email_verified,
            name: payload.name,
            picture: payload.picture,
            given_name: payload.given_name,
            family_name: payload.family_name
        };
    }
    catch {
        throw new Error('Failed to verify Google ID token');
    }
};
exports.verifyGoogleIdToken = verifyGoogleIdToken;
