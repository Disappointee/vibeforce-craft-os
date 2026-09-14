/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    const collection = new Collection({
        "createRule": "@request.auth.id != ''",
        "deleteRule": "author = @request.auth.id",
        "fields": [
            {
                "autogeneratePattern": "[a-z0-9]{15}",
                "help": "",
                "hidden": false,
                "id": "text3208210256",
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
                "collectionId": "pbc_2602490748",
                "help": "",
                "hidden": false,
                "id": "relation2375276105",
                "maxSelect": 1,
                "name": "task",
                "presentable": false,
                "required": true,
                "system": false,
                "type": "relation"
            },
            {
                "cascadeDelete": false,
                "collectionId": "_pb_users_auth_",
                "help": "",
                "hidden": false,
                "id": "relation1579384326",
                "maxSelect": 1,
                "name": "author",
                "presentable": false,
                "required": true,
                "system": false,
                "type": "relation"
            },
            {
                "help": "",
                "hidden": false,
                "id": "editor3888127722",
                "max": 0,
                "min": 0,
                "name": "content",
                "pattern": "",
                "presentable": false,
                "primaryKey": false,
                "required": true,
                "system": false,
                "type": "editor"
            },
            {
                "help": "",
                "hidden": false,
                "id": "json4166917124",
                "maxSize": 0,
                "name": "mentions",
                "presentable": false,
                "required": false,
                "system": false,
                "type": "json"
            },
            {
                "autogeneratePattern": "",
                "help": "",
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
                "help": "",
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
        "id": "pbc_task_comments",
        "indexes": [
            "CREATE INDEX `idx_task_comments_task` ON `task_comments` (`task`)",
            "CREATE INDEX `idx_task_comments_author` ON `task_comments` (`author`)",
            "CREATE INDEX `idx_task_comments_created` ON `task_comments` (`created`)"
        ],
        "listRule": "@request.auth.id != ''",
        "name": "task_comments",
        "system": false,
        "type": "base",
        "updateRule": "author = @request.auth.id",
        "viewRule": "@request.auth.id != ''"
    });

    return app.save(collection);
}, (app) => {
    const collection = app.findCollectionByNameOrId("task_comments");

    return app.delete(collection);
})
