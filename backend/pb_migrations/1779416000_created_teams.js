/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    const teams = new Collection({
        "id": "pbc_teams",
        "name": "teams",
        "type": "base",
        "system": false,
        "listRule": "@request.auth.id != ''",
        "viewRule": "@request.auth.id != ''",
        "createRule": "@request.auth.id != ''",
        "updateRule": "@request.auth.role = 'admin' || @request.auth.id = lead",
        "deleteRule": "@request.auth.role = 'admin'",
        "fields": [
            {
                "autogeneratePattern": "[a-z0-9]{15}",
                "hidden": false,
                "id": "text_id",
                "max": 15,
                "min": 15,
                "name": "id",
                "pattern": "^[a-z0-9]+$",
                "presentable": false,
                "primaryKey": true,
                "required": true,
                "system": true,
                "type": "text"
            },
            {
                "autogeneratePattern": "",
                "hidden": false,
                "id": "text_name",
                "max": 0,
                "min": 0,
                "name": "name",
                "pattern": "",
                "presentable": true,
                "primaryKey": false,
                "required": true,
                "system": false,
                "type": "text"
            },
            {
                "autogeneratePattern": "",
                "hidden": false,
                "id": "text_desc",
                "max": 0,
                "min": 0,
                "name": "description",
                "pattern": "",
                "presentable": false,
                "primaryKey": false,
                "required": false,
                "system": false,
                "type": "text"
            },
            {
                "cascadeDelete": false,
                "collectionId": "_pb_users_auth_",
                "hidden": false,
                "id": "relation_lead",
                "maxSelect": 1,
                "name": "lead",
                "presentable": false,
                "required": false,
                "system": false,
                "type": "relation"
            },
            {
                "autogeneratePattern": "",
                "hidden": false,
                "id": "created",
                "max": 0,
                "min": 0,
                "name": "created",
                "onCreate": true,
                "onUpdate": false,
                "pattern": "",
                "presentable": false,
                "primaryKey": false,
                "required": false,
                "system": true,
                "type": "autodate"
            },
            {
                "autogeneratePattern": "",
                "hidden": false,
                "id": "updated",
                "max": 0,
                "min": 0,
                "name": "updated",
                "onCreate": true,
                "onUpdate": true,
                "pattern": "",
                "presentable": false,
                "primaryKey": false,
                "required": false,
                "system": true,
                "type": "autodate"
            }
        ],
        "indexes": []
    });
    app.save(teams);

    const teamMembers = new Collection({
        "id": "pbc_team_members",
        "name": "team_members",
        "type": "base",
        "system": false,
        "listRule": "@request.auth.id != ''",
        "viewRule": "@request.auth.id != ''",
        "createRule": "@request.auth.id != ''",
        "updateRule": "@request.auth.role = 'admin' || @request.auth.id = team.lead",
        "deleteRule": "@request.auth.role = 'admin' || @request.auth.id = team.lead",
        "fields": [
            {
                "autogeneratePattern": "[a-z0-9]{15}",
                "hidden": false,
                "id": "text_id",
                "max": 15,
                "min": 15,
                "name": "id",
                "pattern": "^[a-z0-9]+$",
                "presentable": false,
                "primaryKey": true,
                "required": true,
                "system": true,
                "type": "text"
            },
            {
                "cascadeDelete": true,
                "collectionId": "pbc_teams",
                "hidden": false,
                "id": "relation_team",
                "maxSelect": 1,
                "name": "team",
                "presentable": false,
                "required": true,
                "system": false,
                "type": "relation"
            },
            {
                "cascadeDelete": true,
                "collectionId": "_pb_users_auth_",
                "hidden": false,
                "id": "relation_user",
                "maxSelect": 1,
                "name": "user",
                "presentable": false,
                "required": true,
                "system": false,
                "type": "relation"
            },
            {
                "hidden": false,
                "id": "select_role",
                "maxSelect": 1,
                "name": "role",
                "presentable": false,
                "required": false,
                "system": false,
                "type": "select",
                "values": [
                    "lead",
                    "member"
                ]
            },
            {
                "autogeneratePattern": "",
                "hidden": false,
                "id": "created",
                "max": 0,
                "min": 0,
                "name": "created",
                "onCreate": true,
                "onUpdate": false,
                "pattern": "",
                "presentable": false,
                "primaryKey": false,
                "required": false,
                "system": true,
                "type": "autodate"
            },
            {
                "autogeneratePattern": "",
                "hidden": false,
                "id": "updated",
                "max": 0,
                "min": 0,
                "name": "updated",
                "onCreate": true,
                "onUpdate": true,
                "pattern": "",
                "presentable": false,
                "primaryKey": false,
                "required": false,
                "system": true,
                "type": "autodate"
            }
        ],
        "indexes": [
            "CREATE UNIQUE INDEX `idx_team_user` ON `team_members` (`team`, `user`)"
        ]
    });
    app.save(teamMembers);
}, (app) => {
    try {
        const teamMembers = app.findCollectionByNameOrId("team_members");
        app.delete(teamMembers);
    } catch (e) {}
    try {
        const teams = app.findCollectionByNameOrId("teams");
        app.delete(teams);
    } catch (e) {}
});
