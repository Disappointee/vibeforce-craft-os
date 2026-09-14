/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    // 1. Create commands collection
    const commands = new Collection({
        "id": "pbc_commands",
        "name": "commands",
        "type": "base",
        "system": false,
        "listRule": "",
        "viewRule": "",
        "createRule": "",
        "updateRule": "",
        "deleteRule": "",
        "fields": [
            {
                "id": "text_id",
                "name": "id",
                "type": "text",
                "system": true,
                "primaryKey": true,
                "required": true,
                "pattern": "^[a-z0-9]+$",
                "autogeneratePattern": "[a-z0-9]{15}"
            },
            {
                "id": "text_source",
                "name": "source",
                "type": "text",
                "required": true
            },
            {
                "id": "text_target",
                "name": "target",
                "type": "text",
                "required": true
            },
            {
                "id": "text_command",
                "name": "command",
                "type": "text",
                "required": true
            },
            {
                "id": "json_payload",
                "name": "payload",
                "type": "json",
                "required": false
            },
            {
                "id": "select_status",
                "name": "status",
                "type": "select",
                "required": true,
                "maxSelect": 1,
                "values": ["pending", "processing", "done", "error"]
            },
            {
                "id": "created",
                "name": "created",
                "type": "autodate",
                "system": true,
                "onCreate": true,
                "onUpdate": false
            },
            {
                "id": "updated",
                "name": "updated",
                "type": "autodate",
                "system": true,
                "onCreate": true,
                "onUpdate": true
            }
        ]
    });
    app.save(commands);

    // 2. Create command_results collection
    const commandResults = new Collection({
        "id": "pbc_command_results",
        "name": "command_results",
        "type": "base",
        "system": false,
        "listRule": "",
        "viewRule": "",
        "createRule": "",
        "updateRule": "",
        "deleteRule": "",
        "fields": [
            {
                "id": "text_id",
                "name": "id",
                "type": "text",
                "system": true,
                "primaryKey": true,
                "required": true,
                "pattern": "^[a-z0-9]+$",
                "autogeneratePattern": "[a-z0-9]{15}"
            },
            {
                "id": "relation_command",
                "name": "command_id",
                "type": "relation",
                "required": true,
                "collectionId": "pbc_commands",
                "maxSelect": 1,
                "cascadeDelete": true
            },
            {
                "id": "json_result",
                "name": "result",
                "type": "json",
                "required": false
            },
            {
                "id": "text_error",
                "name": "error",
                "type": "text",
                "required": false
            },
            {
                "id": "number_duration",
                "name": "duration_ms",
                "type": "number",
                "required": false
            },
            {
                "id": "created",
                "name": "created",
                "type": "autodate",
                "system": true,
                "onCreate": true,
                "onUpdate": false
            },
            {
                "id": "updated",
                "name": "updated",
                "type": "autodate",
                "system": true,
                "onCreate": true,
                "onUpdate": true
            }
        ]
    });
    app.save(commandResults);
}, (app) => {
    try {
        const commandResults = app.findCollectionByNameOrId("command_results");
        app.delete(commandResults);
    } catch(e) {}
    try {
        const commands = app.findCollectionByNameOrId("commands");
        app.delete(commands);
    } catch(e) {}
});
