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
                "autogeneratePattern": "",
                "help": "",
                "hidden": false,
                "id": "text1579384326",
                "max": 0,
                "min": 0,
                "name": "name",
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
                "id": "text2363389745",
                "max": 0,
                "min": 0,
                "name": "company",
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
                "id": "text3888127722",
                "max": 0,
                "min": 0,
                "name": "email",
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
                "id": "text3955205585",
                "max": 0,
                "min": 0,
                "name": "phone",
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
                "id": "text4166917124",
                "max": 0,
                "min": 0,
                "name": "address",
                "pattern": "",
                "presentable": false,
                "primaryKey": false,
                "required": false,
                "system": false,
                "type": "text"
            },
            {
                "convertURLs": false,
                "help": "",
                "hidden": false,
                "id": "editor1843675174",
                "maxSize": 0,
                "name": "notes",
                "presentable": false,
                "required": false,
                "system": false,
                "type": "editor"
            },
            {
                "help": "",
                "hidden": false,
                "id": "select2063623452",
                "maxSelect": 1,
                "name": "status",
                "presentable": false,
                "required": false,
                "system": false,
                "type": "select",
                "values": [
                    "active",
                    "inactive"
                ]
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
        "id": "pbc_clients",
        "indexes": [],
        "listRule": "@request.auth.id != ''",
        "name": "clients",
        "system": false,
        "type": "base",
        "updateRule": "@request.auth.id != ''",
        "viewRule": "@request.auth.id != ''"
    });

    return app.save(collection);
}, (app) => {
    const collection = app.findCollectionByNameOrId("clients");

    return app.delete(collection);
})
