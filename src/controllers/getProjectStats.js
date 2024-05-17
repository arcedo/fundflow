const StatsProjects = require('../models/statsProjects');

async function getProjectStats(projectId) {
    console.log('Inside getProjectStats, projectId:', projectId);

    const pipeline = [
        {
            $match: { idProject: projectId }
        },
        {
            $group: {
                _id: null,
                views: { $sum: { $cond: [{ $eq: ["$view", true] }, 1, 0] } },
                likes: { $sum: { $cond: [{ $eq: ["$like", true] }, 1, 0] } },
                dislikes: { $sum: { $cond: [{ $eq: ["$dislike", true] }, 1, 0] } },
                funded: { $sum: "$funded" },
                collaborators: { $sum: { $cond: [{ $eq: ["$collaborator", true] }, 1, 0] } }
            }
        },
        {
            $project: {
                _id: 0,
                views: 1,
                likes: 1,
                dislikes: 1,
                funded: 1,
                collaborators: 1
            }
        }
    ];

    console.log('Aggregation pipeline:', JSON.stringify(pipeline, null, 2));

    const result = await StatsProjects.aggregate(pipeline).exec();

    console.log('Aggregate result:', result);
    return result;
}

module.exports = getProjectStats;
