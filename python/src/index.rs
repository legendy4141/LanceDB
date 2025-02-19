// Copyright 2024 Lance Developers.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

use std::sync::Mutex;

use lancedb::index::scalar::FtsIndexBuilder;
use lancedb::{
    index::{
        scalar::BTreeIndexBuilder,
        vector::{IvfHnswPqIndexBuilder, IvfHnswSqIndexBuilder, IvfPqIndexBuilder},
        Index as LanceDbIndex,
    },
    DistanceType,
};
use pyo3::{
    exceptions::{PyError, PyRuntimeError, PyValueError},
    pyclass, pymethods, IntoPy, PyObject, PyResult, Python,
};

use crate::util::parse_distance_type;

#[pyclass]
pub struct Index {
    inner: Mutex<Option<LanceDbIndex>>,
}

impl Index {
    pub fn consume(&self) -> PyResult<LanceDbIndex> {
        self.inner
            .lock()
            .unwrap()
            .take()
            .ok_or_else(|| PyRuntimeError::new_err("cannot use an Index more than once"))
    }
}

#[pymethods]
impl Index {
    #[pyo3(signature = (distance_type=None, num_partitions=None, num_sub_vectors=None,num_bits=None, max_iterations=None, sample_rate=None))]
    #[staticmethod]
    pub fn ivf_pq(
        distance_type: Option<String>,
        num_partitions: Option<u32>,
        num_sub_vectors: Option<u32>,
        num_bits: Option<u32>,
        max_iterations: Option<u32>,
        sample_rate: Option<u32>,
    ) -> PyResult<Self> {
        let mut ivf_pq_builder = IvfPqIndexBuilder::default();
        if let Some(distance_type) = distance_type {
            let distance_type = match distance_type.as_str() {
                "l2" => Ok(DistanceType::L2),
                "cosine" => Ok(DistanceType::Cosine),
                "dot" => Ok(DistanceType::Dot),
                _ => Err(PyValueError::new_err(format!(
                    "Invalid distance type '{}'.  Must be one of l2, cosine, or dot",
                    distance_type
                ))),
            }?;
            ivf_pq_builder = ivf_pq_builder.distance_type(distance_type);
        }
        if let Some(num_partitions) = num_partitions {
            ivf_pq_builder = ivf_pq_builder.num_partitions(num_partitions);
        }
        if let Some(num_sub_vectors) = num_sub_vectors {
            ivf_pq_builder = ivf_pq_builder.num_sub_vectors(num_sub_vectors);
        }
        if let Some(num_bits) = num_bits {
            ivf_pq_builder = ivf_pq_builder.num_bits(num_bits);
        }
        if let Some(max_iterations) = max_iterations {
            ivf_pq_builder = ivf_pq_builder.max_iterations(max_iterations);
        }
        if let Some(sample_rate) = sample_rate {
            ivf_pq_builder = ivf_pq_builder.sample_rate(sample_rate);
        }
        Ok(Self {
            inner: Mutex::new(Some(LanceDbIndex::IvfPq(ivf_pq_builder))),
        })
    }

    #[staticmethod]
    pub fn btree() -> PyResult<Self> {
        Ok(Self {
            inner: Mutex::new(Some(LanceDbIndex::BTree(BTreeIndexBuilder::default()))),
        })
    }

    #[staticmethod]
    pub fn bitmap() -> PyResult<Self> {
        Ok(Self {
            inner: Mutex::new(Some(LanceDbIndex::Bitmap(Default::default()))),
        })
    }

    #[staticmethod]
    pub fn label_list() -> PyResult<Self> {
        Ok(Self {
            inner: Mutex::new(Some(LanceDbIndex::LabelList(Default::default()))),
        })
    }

    #[pyo3(signature = (with_position=None, base_tokenizer=None, language=None, max_token_length=None, lower_case=None, stem=None, remove_stop_words=None, ascii_folding=None))]
    #[allow(clippy::too_many_arguments)]
    #[staticmethod]
    pub fn fts(
        with_position: Option<bool>,
        base_tokenizer: Option<String>,
        language: Option<String>,
        max_token_length: Option<usize>,
        lower_case: Option<bool>,
        stem: Option<bool>,
        remove_stop_words: Option<bool>,
        ascii_folding: Option<bool>,
    ) -> Self {
        let mut opts = FtsIndexBuilder::default();
        if let Some(with_position) = with_position {
            opts = opts.with_position(with_position);
        }
        if let Some(base_tokenizer) = base_tokenizer {
            opts.tokenizer_configs = opts.tokenizer_configs.base_tokenizer(base_tokenizer);
        }
        if let Some(language) = language {
            opts.tokenizer_configs = opts.tokenizer_configs.language(&language).unwrap();
        }
        opts.tokenizer_configs = opts.tokenizer_configs.max_token_length(max_token_length);
        if let Some(lower_case) = lower_case {
            opts.tokenizer_configs = opts.tokenizer_configs.lower_case(lower_case);
        }
        if let Some(stem) = stem {
            opts.tokenizer_configs = opts.tokenizer_configs.stem(stem);
        }
        if let Some(remove_stop_words) = remove_stop_words {
            opts.tokenizer_configs = opts.tokenizer_configs.remove_stop_words(remove_stop_words);
        }
        if let Some(ascii_folding) = ascii_folding {
            opts.tokenizer_configs = opts.tokenizer_configs.ascii_folding(ascii_folding);
        }
        Self {
            inner: Mutex::new(Some(LanceDbIndex::FTS(opts))),
        }
    }

    #[pyo3(signature = (distance_type=None, num_partitions=None, num_sub_vectors=None,num_bits=None, max_iterations=None, sample_rate=None, m=None, ef_construction=None))]
    #[staticmethod]
    #[allow(clippy::too_many_arguments)]
    pub fn hnsw_pq(
        distance_type: Option<String>,
        num_partitions: Option<u32>,
        num_sub_vectors: Option<u32>,
        num_bits: Option<u32>,
        max_iterations: Option<u32>,
        sample_rate: Option<u32>,
        m: Option<u32>,
        ef_construction: Option<u32>,
    ) -> PyResult<Self> {
        let mut hnsw_pq_builder = IvfHnswPqIndexBuilder::default();
        if let Some(distance_type) = distance_type {
            let distance_type = parse_distance_type(distance_type)?;
            hnsw_pq_builder = hnsw_pq_builder.distance_type(distance_type);
        }
        if let Some(num_partitions) = num_partitions {
            hnsw_pq_builder = hnsw_pq_builder.num_partitions(num_partitions);
        }
        if let Some(num_sub_vectors) = num_sub_vectors {
            hnsw_pq_builder = hnsw_pq_builder.num_sub_vectors(num_sub_vectors);
        }
        if let Some(num_bits) = num_bits {
            hnsw_pq_builder = hnsw_pq_builder.num_bits(num_bits);
        }
        if let Some(max_iterations) = max_iterations {
            hnsw_pq_builder = hnsw_pq_builder.max_iterations(max_iterations);
        }
        if let Some(sample_rate) = sample_rate {
            hnsw_pq_builder = hnsw_pq_builder.sample_rate(sample_rate);
        }
        if let Some(m) = m {
            hnsw_pq_builder = hnsw_pq_builder.num_edges(m);
        }
        if let Some(ef_construction) = ef_construction {
            hnsw_pq_builder = hnsw_pq_builder.ef_construction(ef_construction);
        }
        Ok(Self {
            inner: Mutex::new(Some(LanceDbIndex::IvfHnswPq(hnsw_pq_builder))),
        })
    }

    #[pyo3(signature = (distance_type=None, num_partitions=None, max_iterations=None, sample_rate=None, m=None, ef_construction=None))]
    #[staticmethod]
    pub fn hnsw_sq(
        distance_type: Option<String>,
        num_partitions: Option<u32>,
        max_iterations: Option<u32>,
        sample_rate: Option<u32>,
        m: Option<u32>,
        ef_construction: Option<u32>,
    ) -> PyResult<Self> {
        let mut hnsw_sq_builder = IvfHnswSqIndexBuilder::default();
        if let Some(distance_type) = distance_type {
            let distance_type = parse_distance_type(distance_type)?;
            hnsw_sq_builder = hnsw_sq_builder.distance_type(distance_type);
        }
        if let Some(num_partitions) = num_partitions {
            hnsw_sq_builder = hnsw_sq_builder.num_partitions(num_partitions);
        }
        if let Some(max_iterations) = max_iterations {
            hnsw_sq_builder = hnsw_sq_builder.max_iterations(max_iterations);
        }
        if let Some(sample_rate) = sample_rate {
            hnsw_sq_builder = hnsw_sq_builder.sample_rate(sample_rate);
        }
        if let Some(m) = m {
            hnsw_sq_builder = hnsw_sq_builder.num_edges(m);
        }
        if let Some(ef_construction) = ef_construction {
            hnsw_sq_builder = hnsw_sq_builder.ef_construction(ef_construction);
        }
        Ok(Self {
            inner: Mutex::new(Some(LanceDbIndex::IvfHnswSq(hnsw_sq_builder))),
        })
    }
}

#[pyclass(get_all)]
/// A description of an index currently configured on a column
pub struct IndexConfig {
    /// The type of the index
    pub index_type: String,
    /// The columns in the index
    ///
    /// Currently this is always a list of size 1.  In the future there may
    /// be more columns to represent composite indices.
    pub columns: Vec<String>,
    /// Name of the index.
    pub name: String,
}

#[pymethods]
impl IndexConfig {
    pub fn __repr__(&self) -> String {
        format!(
            "Index({}, columns={:?}, name=\"{}\")",
            self.index_type, self.columns, self.name
        )
    }

    // For backwards-compatibility with the old sync SDK, we also support getting
    // attributes via __getitem__.
    pub fn __getitem__(&self, : String, py: Python<'_>) -> PyResult<PyObject> {
        match .as_str() {
            "index_type" => Ok(self.index_type.clone().into_py(py)),
            "columns" => Ok(self.columns.clone().into_py(py)),
            "name" | "index_name" => Ok(self.name.clone().into_py(py)),
            _ => Err(PyError::new_err(format!("Invalid : {}", ))),
        }
    }
}

impl From<lancedb::index::IndexConfig> for IndexConfig {
    fn from(value: lancedb::index::IndexConfig) -> Self {
        let index_type = format!("{:?}", value.index_type);
        Self {
            index_type,
            columns: value.columns,
            name: value.name,
        }
    }
}
