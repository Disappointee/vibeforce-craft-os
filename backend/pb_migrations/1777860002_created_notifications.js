/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    const collection = new Collection({
        "createRule": "@request.auth.id != ''",
        "deleteRule": "@request.auth.id != ''",
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
                "cascadeDelete": false,
                "collectionId": "_pb_users_auth_",
                "help": "",
                "hidden": false,
                "id": "relation2375276105",
                "maxSelect": 1,
                "name": "user",
                "presentable": false,
                "required": true,
                "system": false,
                "type": "relation"
            },
            {
                "help": "",
                "hidden": false,
                "id": "select2363389745",
                "maxSelect": 1,
                "name": "type",
                "presentable": false,
                "required": true,
                "system": false,
                "type": "select",
                "values": [
                    "task_assigned",
                    "task_due",
                    "task_comment",
                    "task_mention",
                    "status_change",
                    "project_update"
                ]
            },
            {
                "autogeneratePattern": "",
                "help": "",
                "hidden": false,
                "id": "text1579384326",
                "max": 0,
                "min": 0,
                "name": "title",
                "pattern": "",
                "presentable": false,
                "primaryKey": false,
                "required": true,
                "system": false,
                "type": "text"
            },
            {
                "autogeneratePattern": "",
                "help": "",
                "hidden": false,
                "id": "text3888127722",
                "max": 0,
                "min": 0,
                "name": "message",
                "pattern": "",
                "presentable": false,
                "primaryKey": false,
                "required": true,
                "system": false,
                "type": "text"
            },
            {
                "help": "",
                "hidden": false,
                "id": "bool3955205585",
                "name": "read",
                "presentable": false,
                "required": false,
                "system": false,
                "type": "bool"
            },
            {
                "autogeneratePattern": "",
                "help": "",
                "hidden": false,
                "id": "text4166917124",
                "max": 0,
                "min": 0,
                "name": "link",
                "pattern": "",
                "presentable": false,
                "primaryKey": false,
                "required": false,
                "system": false,
                "type": "text"
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
        "id": "pbc_notifications",
        "indexes": [
            "CREATE INDEX `idx_notifications_user` ON `notifications` (`user`)",
            "CREATE INDEX `idx_notifications_read` ON `notifications` (`read`)"
        ],
        "listRule": "user = @request.auth.id",
        "name": "notifications",
        "system": false,
        "type": "base",
        "updateRule": "user = @request.auth.id",
        "viewRule": "user = @request.auth.id"
    });

    return app.save(collection);
}, (app) => {
    const collection = app.findCollectionByNameOrId("notifications");

    return app.delete(collection);
})
