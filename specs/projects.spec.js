const { describe, expect, test, afterAll } = require('bun:test');

const endPoint = `${process.env.SERVER_HOST_HTTP}:${process.env.SERVER_PORT}/`;

const testProject = {
    idCategory: 1,
    title: 'testProject',
    description: 'description testProject...',
    goal: 1000,
    typeGoal: 'price',
    deadlineDate: '2024-12-31',
    currency: 'USD'
};

const testUser = {
    username: 'testProjectUser',
    email: 'userProject@test.net',
    password: 'password',
    confirmationPassword: 'password'
};

async function login() {
    const response = await fetch(endPoint + 'auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testUser),
    });
    const data = await response.json();
    return data;
}

let userData = {};

let createdProjectId = 0;
describe('projects', () => {
    test('create project without being logged', async () => {
        const response = await fetch(endPoint + 'projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testProject),
        });
        expect(response.status).toBe(401);
    });

    test('create project without required values', async () => {
        userData = await login();
        const response = await fetch(endPoint + 'projects', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': userData.token
            },
            body: JSON.stringify({
                idCategory: testProject.idCategory,
                title: '',
                description: testProject.description,
                goal: 1000,
                typeGoal: testProject.typeGoal,
                deadline: testProject.deadline,
                currency: testProject.currency
            })
        });
        expect(response.status).toBe(400);
    });

    test('create project', async () => {
        const response = await fetch(endPoint + 'projects', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': userData.token
            },
            body: JSON.stringify(testProject)
        });
        const data = await response.json();
        createdProjectId = data.id;
        expect(response.status).toBe(201);
    });

    test('modify project without being logged', async () => {
        const response = await fetch(endPoint + 'projects/' + createdProjectId, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testProject),
        });
        expect(response.status).toBe(401);
    });

    test('modify project without required values', async () => {
        const response = await fetch(endPoint + 'projects/' + createdProjectId, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': userData.token
            },
            body: JSON.stringify({
                idCategory: testProject.idCategory,
                title: '',
                description: testProject.description,
                goal: testProject.goal,
                typeGoal: testProject.typeGoal,
                deadline: testProject.deadline,
                currency: testProject.currency
            })
        });
        expect(response.status).toBe(400);
    });

    test('modify project', async () => {
        const response = await fetch(endPoint + 'projects/' + createdProjectId, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': userData.token
            },
            body: JSON.stringify(testProject)
        });
        expect(response.status).toBe(200);
    });

    //TODO: PUT ABOUT AND Cover

    test('get projects', async () => {
        const response = await fetch(endPoint + 'projects?startIndex=0&limit=1');
        const data = await response.json();
        expect(response.status).toBe(200);
        expect(data.length).toBeGreaterThan(0);
    });

    test('get project', async () => {
        const response = await fetch(endPoint + 'projects/' + createdProjectId);
        const data = await response.json();
        expect(response.status).toBe(200);
        expect(data.id).toBe(createdProjectId);
    });

    test('get project by category', async () => {
        const response = await fetch(endPoint + 'projects/byCategory/' + testProject.idCategory + '?startIndex=0&limit=1');
        const data = await response.json();
        expect(response.status).toBe(200);
        expect(data.length).toBeGreaterThan(0);
    });

    test('get project by user', async () => {
        const response = await fetch(endPoint + 'projects/byUser/' + userData.id + '?startIndex=0&limit=1');
        const data = await response.json();
        expect(response.status).toBe(200);
        expect(data.length).toBeGreaterThan(0);
    });

    test('get random projects', async () => {
        const response = await fetch(endPoint + 'projects/random?startIndex=0&limit=1');
        const data = await response.json();
        expect(response.status).toBe(200);
        expect(data.length).toBeGreaterThan(0);
    });

    test('delete project without being logged', async () => {
        const response = await fetch(endPoint + 'projects/' + createdProjectId, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
        });
        expect(response.status).toBe(401);
    });
});

afterAll(async () => {
    await fetch(`${endPoint}users/${userData.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': userData.token },
    });
});