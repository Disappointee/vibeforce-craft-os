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
                "help": "",
                "hidden": false,
                "id": "bool2363389745",
                "name": "completed",
                "presentable": false,
                "required": false,
                "system": false,
                "type": "bool"
            },
            {
                "help": "",
                "hidden": false,
                "id": "number3888127722",
                "max": null,
                "min": 0,
                "name": "sort_order",
                "onlyInt": true,
                "presentable": false,
                "required": false,
                "system": false,
                "type": "number"
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
        "id": "pbc_checklist_items",
        "indexes": [
            "CREATE INDEX `idx_checklist_items_task` ON `checklist_items` (`task`)",
            "CREATE INDEX `idx_checklist_items_sort` ON `checklist_items` (`task`, `sort_order`)"
        ],
        "listRule": "@request.auth.id != ''",
        "name": "checklist_items",
        "system": false,
        "type": "base",
        "updateRule": "@request.auth.id != ''",
        "viewRule": "@request.auth.id != ''"
    });

    return app.save(collection);
}, (app) => {
    const collection = app.findCollectionByNameOrId("checklist_items");

    return app.delete(collection);
})
