#  Copyright (c) 2023. LanceDB Developers
#
#  Licensed under the Apache License, Version 2.0 (the "License");
#  you may not use this file except in compliance with the License.
#  You may obtain a copy of the License at
#      http://www.apache.org/licenses/LICENSE-2.0
#
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.
# ruff: noqa: F401
from .base import EmbeddingFunction, EmbeddingFunctionConfig, TextEmbeddingFunction
from .bedrock import BedRockText
from .cohere import CohereEmbeddingFunction
from .gemini_text import GeminiText
from .instructor import InstructorEmbeddingFunction
from .ollama import OllamaEmbeddings
from .open_clip import OpenClipEmbeddings
from . import Embeddings
from .registry import EmbeddingFunctionRegistry, get_registry
from .sentence_transformers import SentenceTransformerEmbeddings
from .gte import GteEmbeddings
from .transformers import TransformersEmbeddingFunction, ColbertEmbeddings
from .imagebind import ImageBindEmbeddings
from .utils import with_embeddings
from .jinaai import JinaEmbeddings
from .watsonx import WatsonxEmbeddings
from .voyageai import VoyageAIEmbeddingFunction
