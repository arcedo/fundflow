const { describe, expect, test, afterAll } = require('bun:test');

const fs = require('fs');
const FormData = require('form-data');

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

let createdBlogId = 0;

let createdProjectId = 0;
let createdProjectTite = '';

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
        userData = await createNewUser();
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

    test('create stats project without being logged', async () => {
        const response = await fetch(endPoint + 'projects/' + createdProjectId + '/stats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idCategory: testProject.idCategory }),
        });
        expect(response.status).toBe(401);
    });

    test('create stats project', async () => {
        const response = await fetch(endPoint + 'projects/' + createdProjectId + '/stats', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': userData.token
            },
            body: JSON.stringify({ idCategory: testProject.idCategory })
        });
        expect(response.status).toBe(201);
    });

    test('modify stats project', async () => {
        const response = await fetch(endPoint + 'projects/' + createdProjectId + '/stats', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': userData.token
            },
            body: JSON.stringify({ idProject: createdProjectId, evaluation: 'like' })
        });
        expect(response.status).toBe(200);
    });

    test('get categories view percentage', async () => {
        const response = await fetch(endPoint + 'projects/stats/percentageViews');
        const data = await response.json();
        expect(response.status).toBe(200);
        expect(data.length).toBeGreaterThan(0);
    });

    test('get projects', async () => {
        const response = await fetch(endPoint + 'projects?startIndex=0&limit=1');
        const data = await response.json();
        expect(response.status).toBe(200);
        expect(data.length).toBeGreaterThan(0);
    });

    test('get project by id', async () => {
        const response = await fetch(endPoint + 'projects/byId/' + createdProjectId);
        const data = await response.json();
        expect(response.status).toBe(200);
        createdProjectTite = data.projectUrl;
        expect(data.id).toBe(createdProjectId);
    });

    test('get project', async () => {
        const response = await fetch(endPoint + 'projects/' + createdProjectTite);
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
        const response = await fetch(endPoint + 'projects/byUser?startIndex=0&limit=1', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': userData.token
            }
        });
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
    //TODO: GET by interest, Like project, View Project, Dislike...

    test('create project blog without being logged', async () => {
        const response = await fetch(endPoint + 'projects/' + createdProjectId + '/blog', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: 'title', content: 'content' }),
        });
        expect(response.status).toBe(401);
    });

    test('create project blog', async () => {
        const response = await fetch(endPoint + 'projects/' + createdProjectId + '/blog', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': userData.token
            },
            body: JSON.stringify({ title: 'test title blog', content: 'Lorem ipsum dolor a an cora...' })
        });
        expect(response.status).toBe(201);
    });

    test('get project blog', async () => {
        const response = await fetch(endPoint + 'projects/' + createdProjectId + '/blog');
        const data = await response.json();
        expect(response.status).toBe(200);
        expect(data.length).toBeGreaterThan(0);
        createdBlogId = data[0]._id;
    });

    test('modify project blog', async () => {
        const response = await fetch(endPoint + 'projects/' + createdProjectId + '/blog/' + createdBlogId, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': userData.token
            },
            body: JSON.stringify({ title: 'test title blog', content: 'some content' })
        });
        expect(response.status).toBe(200);
    });

    test('delete project blog', async () => {
        const response = await fetch(endPoint + 'projects/' + createdProjectId + '/blog/' + createdBlogId, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': userData.token
            }
        });
        expect(response.status).toBe(200);
    });

    test('delete project without being logged', async () => {
        const response = await fetch(endPoint + 'projects/' + createdProjectId, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
        });
        expect(response.status).toBe(401);
    });

    test('delete project', async () => {
        const response = await fetch(endPoint + 'projects/' + createdProjectId, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': userData.token
            }
        });
        expect(response.status).toBe(200);
    });

    afterAll(async () => {
        await fetch(`${endPoint}users/`, {
            method: 'DELETE',
            headers: { 'Authorization': userData.token },
            body: JSON.stringify({ password: testUser.password }),
        });
    });
});