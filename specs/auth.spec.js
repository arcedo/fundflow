const { describe, expect, test } = require('bun:test');

const endPoint = `${process.env.SERVER_HOST_HTTP}:${process.env.SERVER_PORT}/auth/`;

const testUser = {
    username: 'testUser',
    email: 'user@test.net',
    password: 'password',
    confirmationPassword: 'password'
};

let createdUserData = {};
describe('auth register', () => {
    test('create user without email', async () => {
        const response = await fetch(endPoint + 'register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: testUser.username,
                email: '',
                password: testUser.password,
                confirmationPassword: testUser.confirmationPassword
            }),
        });
        expect(response.status).toBe(400);
    });

    test('create user passwords don\'t match', async () => {
        const response = await fetch(endPoint + 'register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: testUser.username,
                email: testUser.email,
                password: 'anotherPassword',
                confirmationPassword: testUser.confirmationPassword
            }),
        });
        expect(response.status).toBe(400);
    });

    test('create user', async () => {
        const response = await fetch(endPoint + 'register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testUser),
        });
        const data = await response.json();
        expect(response.status).toBe(201);
    });

    test('create user that already exists', async () => {
        const response = await fetch(endPoint + 'register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testUser),
        });
        expect(response.status).toBe(400);
    });
});

describe('auth login', () => {
    test('login with required values', async () => {
        const response = await fetch(endPoint + 'login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: '',
                password: ''
            }),
        });
        expect(response.status).toBe(400);
    });

    test('login with wrong password', async () => {
        const response = await fetch(endPoint + 'login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: testUser.email,
                password: 'wrongPassword'
            }),
        });
        expect(response.status).toBe(401);
    });

    test('login with username', async () => {
        const response = await fetch(endPoint + 'login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: testUser.username,
                password: testUser.password
            }),
        });
        expect(response.status).toBe(200);
    });

    test('login with email', async () => {
        const response = await fetch(endPoint + 'login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: testUser.email,
                password: testUser.password
            }),
        });
        createdUserData = await response.json();
        expect(response.status).toBe(200);
    });
});

describe('auth created delete user', () => {
    test('delete user without token', async () => {
        const response = await fetch(`${process.env.SERVER_HOST_HTTP}:${process.env.SERVER_PORT}/users/`, {
            method: 'DELETE',
        });
        expect(response.status).toBe(401);
    });

    test('delete user', async () => {
        const response = await fetch(`${process.env.SERVER_HOST_HTTP}:${process.env.SERVER_PORT}/users`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': createdUserData.token
            }
        });
        const data = await response.json();
        expect(response.status).toBe(200);
    });
});