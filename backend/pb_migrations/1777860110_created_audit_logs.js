/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    const collection = new Collection({
        "createRule": "@request.auth.id != ''",
        "deleteRule": null,
        "fields": [
            {
                "autogeneratePattern": "[a-z0-9]{15}",
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
                "autogeneratePattern": "",
                "hidden": false,
                "id": "text1579384326",
                "max": 50,
                "min": 0,
                "name": "action",
                "pattern": "",
                "presentable": false,
                "primaryKey": false,
                "required": true,
                "system": false,
                "type": "text"
            },
            {
                "autogeneratePattern": "",
                "hidden": false,
                "id": "text523153017",
                "max": 50,
                "min": 0,
                "name": "entity_type",
                "pattern": "",
                "presentable": false,
                "primaryKey": false,
                "required": true,
                "system": false,
                "type": "text"
            },
            {
                "autogeneratePattern": "",
                "hidden": false,
                "id": "text3197783191",
                "max": 15,
                "min": 0,
                "name": "entity_id",
                "pattern": "",
                "presentable": false,
                "primaryKey": false,
                "required": false,
                "system": false,
                "type": "text"
            },
            {
                "autogeneratePattern": "",
                "hidden": false,
                "id": "text425750759",
                "max": 500,
                "min": 0,
                "name": "summary",
                "pattern": "",
                "presentable": false,
                "primaryKey": false,
                "required": true,
                "system": false,
                "type": "text"
            },
            {
                "hidden": false,
                "id": "json2804082995",
                "maxSize": 0,
                "name": "metadata",
                "presentable": false,
                "primaryKey": false,
                "required": false,
                "system": false,
                "type": "json"
            },
            {
                "cascadeDelete": true,
                "collectionId": "_pb_users_auth_",
                "hidden": false,
                "id": "relation2375276105",
                "maxSelect": 1,
                "name": "user",
                "presentable": false,
                "primaryKey": false,
                "required": false,
                "system": false,
                "type": "relation"
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
        "id": "pbc_1777860110",
        "indexes": [
            "CREATE INDEX idx_audit_logs_action ON audit_logs (action)",
            "CREATE INDEX idx_audit_logs_created ON audit_logs (created)"
        ],
        "listRule": "@request.auth.id != '' && (@request.auth.id = user || @request.auth.role = 'admin')",
        "name": "audit_logs",
        "noAuthAuth": false,
        "oauth2": {
            "enabled": false,
            "mappedFields": {
                "avatarURL": "",
                "name": "",
                "username": ""
            }
        },
        "passwordAuth": {
            "enabled": false
        },
        "rule": "",
        "system": false,
        "type": "base",
        "updateRule": null,
        "viewRule": "@request.auth.id != ''",
        "deleteRule": null
    });

    return app.save(collection);
})
