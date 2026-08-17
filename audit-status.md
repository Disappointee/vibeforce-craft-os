# MVP Audit-Status — Golden Record Verifikation

**Erstellt:** 2026-06-02T11:42:21.102Z

## Verknüpfungshierarchie

```
Client:  Test-Agency GmbH  (ID: 0t5x4c998zwf4ay)
  └── Project: Website-Relaunch  (ID: 929df6e516rx57v)
       └── Task: Design-Konzept  (ID: a6l83vtxrvwz94h)
```

## Record Details

| Ebene   | Feld         | Wert                |
|---------|--------------|---------------------|
| Client  | ID           | 0t5x4c998zwf4ay |
| Client  | Name         | Test-Agency GmbH |
| Client  | Status       | active |
| Client  | Abrechenbar  | true |
| Project | ID           | 929df6e516rx57v |
| Project | Name         | Website-Relaunch |
| Project | Key          | WSR |
| Project | Client Ref   | 0t5x4c998zwf4ay |
| Task    | ID           | a6l83vtxrvwz94h |
| Task    | Title        | Design-Konzept |
| Task    | Project Ref  | 929df6e516rx57v |
| Task    | Client (via) | 0t5x4c998zwf4ay |

## Verknüpfungs-Validierung

- Project.client === Client.id: **PASS**
- Task.project === Project.id: **PASS**
- Client.abrechenbar === true: **PASS**
