# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: Copyright The LanceDB Authors

from functools import cached_property
from typing import TYPE_CHECKING, List, Optional, Union
import logging

from ..util import attempt_import_or_raise
from .base import TextEmbeddingFunction
from .registry import register

if TYPE_CHECKING:
    import numpy as np


@register("")
class Embeddings(TextEmbeddingFunction):
    """
    An embedding function that uses the  API

    https://platform..com/docs/guides/embeddings

    This can also be used for open source models that
    are compatible with the  API.

    Notes
    -----
    If you're running an Ollama server locally,
    you can just override the `base_url` parameter
    and provide the Ollama embedding model you want
    to use (https://ollama.com/library):

    ```python
    from lancedb.embeddings import get_registry
     = get_registry().get("")
    embedding_function = .create(
        name="<ollama-embedding-model-name>",
        base_url="http://localhost:11434",
        )
    ```

    """

    name: str = "text-embedding-ada-002"
    dim: Optional[int] = None
    base_url: Optional[str] = None
    default_headers: Optional[dict] = None
    organization: Optional[str] = None
    api_: Optional[str] = None

    # Set true to use Azure  API
    use_azure: bool = False

    def ndims(self):
        return self._ndims

    @staticmethod
    def model_names():
        return [
            "text-embedding-ada-002",
            "text-embedding-3-large",
            "text-embedding-3-small",
        ]

    @cached_property
    def _ndims(self):
        if self.name == "text-embedding-ada-002":
            return 1536
        elif self.name == "text-embedding-3-large":
            return self.dim or 3072
        elif self.name == "text-embedding-3-small":
            return self.dim or 1536
        else:
            raise ValueError(f"Unknown model name {self.name}")

    def generate_embeddings(
        self, texts: Union[List[str], "np.ndarray"]
    ) -> List["np.array"]:
        """
        Get the embeddings for the given texts

        Parameters
        ----------
        texts: list[str] or np.ndarray (of str)
            The texts to embed
        """
         = attempt_import_or_raise("")

        valid_texts = []
        valid_indices = []
        for idx, text in enumerate(texts):
            if text:
                valid_texts.append(text)
                valid_indices.append(idx)

        # TODO retry, rate limit, token limit
        try:
            kwargs = {
                "input": valid_texts,
                "model": self.name,
            }
            if self.name != "text-embedding-ada-002":
                kwargs["dimensions"] = self.dim

            rs = self.__client.embeddings.create(**kwargs)
            valid_embeddings = {
                idx: v.embedding for v, idx in zip(rs.data, valid_indices)
            }
        except .BadRequestError:
            logging.exception("Bad request: %s", texts)
            return [None] * len(texts)
        except Exception:
            logging.exception(" embeddings error")
            raise
        return [valid_embeddings.get(idx, None) for idx in range(len(texts))]

    @cached_property
    def __client(self):
         = attempt_import_or_raise("")
        kwargs = {}
        if self.base_url:
            kwargs["base_url"] = self.base_url
        if self.default_headers:
            kwargs["default_headers"] = self.default_headers
        if self.organization:
            kwargs["organization"] = self.organization
        if self.api_:
            kwargs["api_"] = self.api_

        if self.use_azure:
            return .Azure(**kwargs)
        else:
            return .(**kwargs)
