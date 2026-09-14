/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // --- tasks.assignees: maxSelect=0 (unlimited) + cascadeDelete=true ---
  {
    const col = app.findCollectionByNameOrId("tasks");
    if (col) {
      const old = col.fields.find((f) => f.name === "assignees");
      if (old) {
        const pos = col.fields.indexOf(old);
        col.fields.addAt(pos, new Field({
          "cascadeDelete": true,
          "collectionId": "_pb_users_auth_",
          "help": "",
          "hidden": false,
          "id": old.id || "relation314842844",
          "maxSelect": 0,
          "minSelect": 0,
          "name": "assignees",
          "presentable": false,
          "required": false,
          "system": false,
          "type": "relation"
        }));
        app.save(col);
      }
    }
  }

  // --- projects.client: cascadeDelete=true ---
  {
    const col = app.findCollectionByNameOrId("projects");
    if (col) {
      const old = col.fields.find((f) => f.name === "client");
      if (old) {
        const pos = col.fields.indexOf(old);
        col.fields.addAt(pos, new Field({
          "cascadeDelete": true,
          "collectionId": "pbc_clients",
          "help": "",
          "hidden": false,
          "id": old.id || "relation3515827341",
          "maxSelect": 1,
          "minSelect": 0,
          "name": "client",
          "presentable": false,
          "required": false,
          "system": false,
          "type": "relation"
        }));
        app.save(col);
      }
    }
  }

  // --- time_entries.task: cascadeDelete=true (ensure) ---
  {
    const col = app.findCollectionByNameOrId("time_entries");
    if (col) {
      const old = col.fields.find((f) => f.name === "task");
      if (old) {
        const pos = col.fields.indexOf(old);
        col.fields.addAt(pos, new Field({
          "cascadeDelete": true,
          "collectionId": "pbc_2602490748",
          "help": "",
          "hidden": false,
          "id": old.id || "relation1384045349",
          "maxSelect": 1,
          "minSelect": 0,
          "name": "task",
          "presentable": false,
          "required": true,
          "system": false,
          "type": "relation"
        }));
        app.save(col);
      }
    }
  }
}, (app) => {
  // Down migration
});
