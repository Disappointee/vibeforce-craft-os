/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // 1. notifications.user -> cascadeDelete: true
  {
    const col = app.findCollectionByNameOrId("notifications");
    if (col) {
      const old = col.fields.find((f) => f.name === "user");
      if (old) {
        const pos = col.fields.indexOf(old);
        col.fields.addAt(pos, new Field({
          "cascadeDelete": true,
          "collectionId": "_pb_users_auth_",
          "help": "",
          "hidden": false,
          "id": old.id || "relation2375276105",
          "maxSelect": 1,
          "minSelect": 0,
          "name": "user",
          "presentable": false,
          "required": true,
          "system": false,
          "type": "relation"
        }));
        app.save(col);
      }
    }
  }

  // 2. task_links.source_task & target_task -> cascadeDelete: true
  {
    const col = app.findCollectionByNameOrId("task_links");
    if (col) {
      const tasksCol = app.findCollectionByNameOrId("tasks");
      const tasksColId = tasksCol?.id || "pbc_2602490748";
      
      const oldSource = col.fields.find((f) => f.name === "source_task");
      if (oldSource) {
        const pos = col.fields.indexOf(oldSource);
        col.fields.addAt(pos, new Field({
          "cascadeDelete": true,
          "collectionId": tasksColId,
          "help": "",
          "hidden": false,
          "id": oldSource.id || "relation2375276105",
          "maxSelect": 1,
          "minSelect": 0,
          "name": "source_task",
          "presentable": false,
          "required": true,
          "system": false,
          "type": "relation"
        }));
      }
      const oldTarget = col.fields.find((f) => f.name === "target_task");
      if (oldTarget) {
        const pos = col.fields.indexOf(oldTarget);
        col.fields.addAt(pos, new Field({
          "cascadeDelete": true,
          "collectionId": tasksColId,
          "help": "",
          "hidden": false,
          "id": oldTarget.id || "relation2363389745",
          "maxSelect": 1,
          "minSelect": 0,
          "name": "target_task",
          "presentable": false,
          "required": true,
          "system": false,
          "type": "relation"
        }));
      }
      app.save(col);
    }
  }
}, (app) => {
  // Down migration
});
