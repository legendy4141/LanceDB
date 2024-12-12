#  embeddings

LanceDB registers the  embeddings function in the registry by default, as ``. Below are the parameters that you can customize when creating the instances:

| Parameter | Type | Default Value | Description |
|---|---|---|---|
| `name` | `str` | `"text-embedding-ada-002"` | The name of the model. |
| `dim` | `int` |  Model default   | For 's newer text-embedding-3 model, we can specify a dimensionality that is smaller than the 1536 size. This feature supports it |
| `use_azure` | bool | `False` | Set true to use Azure OpenAPI SDK |


```python
import lancedb
from lancedb.pydantic import LanceModel, Vector
from lancedb.embeddings import get_registry

db = lancedb.connect("/tmp/db")
func = get_registry().get("").create(name="text-embedding-ada-002")

class Words(LanceModel):
    text: str = func.SourceField()
    vector: Vector(func.ndims()) = func.VectorField()

table = db.create_table("words", schema=Words, mode="overwrite")
table.add(
    [
        {"text": "hello world"},
        {"text": "goodbye world"}
    ]
    )

query = "greetings"
actual = table.search(query).limit(1).to_pydantic(Words)[0]
print(actual.text)
```