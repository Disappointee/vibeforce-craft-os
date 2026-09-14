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
                "collectionId": "pbc_2602490748",
                "help": "",
                "hidden": false,
                "id": "relation2375276105",
                "maxSelect": 1,
                "name": "source_task",
                "presentable": false,
                "required": true,
                "system": false,
                "type": "relation"
            },
            {
                "cascadeDelete": false,
                "collectionId": "pbc_2602490748",
                "help": "",
                "hidden": false,
                "id": "relation2363389745",
                "maxSelect": 1,
                "name": "target_task",
                "presentable": false,
                "required": true,
                "system": false,
                "type": "relation"
            },
            {
                "help": "",
                "hidden": false,
                "id": "select1579384326",
                "maxSelect": 1,
                "name": "link_type",
                "presentable": false,
                "required": true,
                "system": false,
                "type": "select",
                "values": [
                    "depends_on",
                    "blocks",
                    "relates_to",
                    "duplicate_of"
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
        "id": "pbc_task_links",
        "indexes": [
            "CREATE INDEX `idx_task_links_source` ON `task_links` (`source_task`)",
            "CREATE INDEX `idx_task_links_target` ON `task_links` (`target_task`)"
        ],
        "listRule": "@request.auth.id != ''",
        "name": "task_links",
        "system": false,
        "type": "base",
        "updateRule": "@request.auth.id != ''",
        "viewRule": "@request.auth.id != ''"
    });

    return app.save(collection);
}, (app) => {
    const collection = app.findCollectionByNameOrId("task_links");

    return app.delete(collection);
})
