/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    const collection = new Collection({
        "createRule": "@request.auth.id != ''",
        "deleteRule": "@request.auth.id != ''",
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
                "cascadeDelete": true,
                "collectionId": "pbc_484305853",
                "hidden": false,
                "id": "relation1234567890",
                "maxSelect": 1,
                "minSelect": 0,
                "name": "project",
                "presentable": false,
                "required": true,
                "system": false,
                "type": "relation"
            },
            {
                "help": "",
                "hidden": false,
                "id": "number1234567891",
                "max": null,
                "min": 0,
                "name": "amount",
                "onlyInt": false,
                "presentable": false,
                "required": true,
                "system": false,
                "type": "number"
            },
            {
                "help": "",
                "hidden": false,
                "id": "text1234567892",
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
                "help": "",
                "hidden": false,
                "id": "text1234567893",
                "max": 0,
                "min": 0,
                "name": "category",
                "pattern": "",
                "presentable": false,
                "primaryKey": false,
                "required": false,
                "system": false,
                "type": "text"
            },
            {
                "hidden": false,
                "id": "autodate2990389176",
                "name": "created",
                "onCreate": true,
                "onUpdate": false,
                "presentable": false,
                "system": false,
                "type": "autodate"
            },
            {
                "hidden": false,
                "id": "autodate3332085495",
                "name": "updated",
                "onCreate": true,
                "onUpdate": true,
                "presentable": false,
                "system": false,
                "type": "autodate"
            }
        ],
        "id": "pbc_external_expenses",
        "indexes": [],
        "listRule": "@request.auth.id != ''",
        "name": "external_expenses",
        "system": false,
        "type": "base",
        "updateRule": "@request.auth.id != ''",
        "viewRule": "@request.auth.id != ''"
    });

    return app.save(collection);
}, (app) => {
    const collection = app.findCollectionByNameOrId("pbc_external_expenses");

    return app.delete(collection);
})
