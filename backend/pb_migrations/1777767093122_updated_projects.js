/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    const collection = app.findCollectionByNameOrId("projects")

    // add unique index on the key field
    collection.indexes = collection.indexes.filter(
        (index) => !index.includes("idx_projects_key")
    )
    collection.indexes.push("CREATE UNIQUE INDEX idx_projects_key ON projects (key)")

    return app.save(collection)
}, (app) => {
    const collection = app.findCollectionByNameOrId("projects")

    // remove the unique index
    collection.indexes = collection.indexes.filter(
        (index) => !index.includes("idx_projects_key")
    )

    return app.save(collection)
})
