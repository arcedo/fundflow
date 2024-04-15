const { describe, expect, test } = require('bun:test');

const endPoint = `${process.env.SERVER_HOST_HTTP}:${process.env.SERVER_PORT}/`;

const testUser = {
    username: 'testUser',
    email: 'user@test.net',
    password: 'password',
    confirmationPassword: 'password'
};

let createdCategoryId = 0;
let adminToken = '';

async function createNonAdminTestUser() {
    const response = await fetch(endPoint + 'auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testUser),
    });
    return await response.json();
}

async function loginWithAdmin() {
    const response = await fetch(endPoint + 'auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'admin' }),
    });
    const data = await response.json();
    return data.token;
}

describe('categories', () => {
    test('create category without admin role', async () => {
        const nonAdminUser = await createNonAdminTestUser();
        const response = await fetch(endPoint + 'categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': nonAdminUser.token },
            body: JSON.stringify({
                name: 'testCategory'
            }),
        });
        expect(response.status).toBe(403);
        await fetch(`${endPoint}users/${nonAdminUser.id}`, {
            method: 'DELETE',
            headers: { 'Authorization': nonAdminUser.token },
        });
    });


    test('create category without name', async () => {
        adminToken = await loginWithAdmin();
        const response = await fetch(endPoint + 'categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': adminToken },
            body: JSON.stringify({
                name: ''
            }),
        });
        expect(response.status).toBe(400);
    });

    test('create category', async () => {
        const response = await fetch(endPoint + 'categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': adminToken },
            body: JSON.stringify({
                name: 'testCategory'
            }),
        });
        const data = await response.json();
        createdCategoryId = data.id;
        expect(response.status).toBe(201);
    });

    test('get all categories', async () => {
        const response = await fetch(endPoint + 'categories');
        expect(response.status).toBe(200);
    });

    test('get category by id', async () => {
        const response = await fetch(endPoint + 'categories/' + createdCategoryId);
        expect(response.status).toBe(200);
    });

    test('get category by id that does not exist', async () => {
        const response = await fetch(endPoint + 'categories/999999');
        expect(response.status).toBe(404);
    });

    test('delete category', async () => {
        const response = await fetch(endPoint + 'categories/' + createdCategoryId, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json', 'Authorization': adminToken },
        });
        expect(response.status).toBe(200);
    });
});