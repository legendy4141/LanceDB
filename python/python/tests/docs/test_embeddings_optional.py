import lancedb

# --8<-- [start:imports]
from lancedb.pydantic import LanceModel, Vector
from lancedb.embeddings import get_registry

# --8<-- [end:imports]
import pytest


@pytest.mark.slow
def test_embeddings_():
    # --8<-- [start:_embeddings]
    db = lancedb.connect("/tmp/db")
    func = get_registry().get("").create(name="text-embedding-ada-002")

    class Words(LanceModel):
        text: str = func.SourceField()
        vector: Vector(func.ndims()) = func.VectorField()

    table = db.create_table("words", schema=Words, mode="overwrite")
    table.add([{"text": "hello world"}, {"text": "goodbye world"}])

    query = "greetings"
    actual = table.search(query).limit(1).to_pydantic(Words)[0]
    print(actual.text)
    # --8<-- [end:_embeddings]
