const { describe, expect, test, afterAll, beforeAll } = require('bun:test');

const endPoint = `${process.env.SERVER_HOST_HTTP}:${process.env.SERVER_PORT}/`;

const testUser = {
    username: 'testUsersUser',
    email: 'userUsers@test.net',
    password: 'password',
    confirmationPassword: 'password'
};

async function createNewUser() {
    const response = await fetch(endPoint + 'auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testUser),
    });
    const data = await response.json();
    return data;
}

let userData = {};



describe('users', () => {
    beforeAll(async () => {
        userData = await createNewUser();
    });
    test('get user data', async () => {
        const response = await fetch(endPoint + 'users', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': userData.token
            }
        });
        const data = await response.json();
        expect(response.status).toBe(200);
        expect(data.length).toBe(1);
    });

    test('delete user without being logged', async () => {
        const response = await fetch(endPoint + 'users/' + userData.id, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });
        expect(response.status).toBe(401);
    });

    test('delete user with token', async () => {
        const response = await fetch(endPoint + 'users/', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': userData.token
            },
            body: JSON.stringify({
                password: testUser.password
            }),
        });
        expect(response.status).toBe(200);
    });
});