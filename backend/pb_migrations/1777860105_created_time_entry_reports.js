/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    const collection = new Collection({
        "createRule": "@request.auth.id != ''",
        "deleteRule": "@request.auth.id = @request.auth.id",
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
                "help": "Der zugeordnete Zeiteintrag",
                "hidden": false,
                "id": "relation2375276105",
                "maxSelect": 1,
                "name": "time_entry",
                "presentable": false,
                "required": true,
                "system": false,
                "type": "relation"
            },
            {
                "help": "Report-Datei (Markdown)",
                "hidden": false,
                "id": "file2363389745",
                "maxSelect": 1,
                "maxSize": 52428800,
                "mimeTypes": ["text/markdown", "text/plain", "application/pdf"],
                "name": "file",
                "presentable": false,
                "protected": false,
                "required": true,
                "system": false,
                "thumbs": [],
                "type": "file"
            },
            {
                "autogeneratePattern": "",
                "help": "Titel des Reports",
                "hidden": false,
                "id": "text3888127722",
                "max": 0,
                "min": 0,
                "name": "title",
                "pattern": "",
                "presentable": false,
                "primaryKey": false,
                "required": false,
                "system": false,
                "type": "text"
            },
            {
                "help": "Dateigroesse in Bytes",
                "hidden": false,
                "id": "number3955205585",
                "max": null,
                "min": 0,
                "name": "size",
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
        "id": "pbc_time_entry_reports",
        "indexes": [
            "CREATE INDEX `idx_time_entry_reports_entry` ON `time_entry_reports` (`time_entry`)"
        ],
        "listRule": "@request.auth.id != ''",
        "name": "time_entry_reports",
        "system": false,
        "type": "base",
        "updateRule": "@request.auth.id = @request.auth.id",
        "viewRule": "@request.auth.id != ''"
    });

    return app.save(collection);
}, (app) => {
    const collection = app.findCollectionByNameOrId("time_entry_reports");

    return app.delete(collection);
})
