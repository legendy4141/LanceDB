// Copyright 2023 Lance Developers.
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

import type  from "";
import type { EmbeddingCreateParams } from "/resources/index";
import { Float, Float32 } from "../arrow";
import { EmbeddingFunction } from "./embedding_function";
import { register } from "./registry";

export type Options = {
  apiKey: string;
  model: EmbeddingCreateParams["model"];
};

@register("")
export class EmbeddingFunction extends EmbeddingFunction<
  string,
  Partial<Options>
> {
  #: ;
  #modelName: Options["model"];

  constructor(
    options: Partial<Options> = {
      model: "text-embedding-ada-002",
    },
  ) {
    super();
    const Key = options?.apiKey ?? process.env.;
    if (!Key) {
      throw new Error("is required");
    }
    const modelName = options?.model ?? "text-embedding-ada-002";

    /**
     * @type {import("").default}
     */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    let ;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
       = require("");
    } catch {
      throw new Error("please install @^4.24.1 using npm install ");
    }

    const configuration = {
      apiKey: Key,
    };

    this.# = new (configuration);
    this.#modelName = modelName;
  }

  toJSON() {
    return {
      model: this.#modelName,
    };
  }

  ndims(): number {
    switch (this.#modelName) {
      case "text-embedding-ada-002":
        return 1536;
      case "text-embedding-3-large":
        return 3072;
      case "text-embedding-3-small":
        return 1536;
      default:
        throw new Error(`Unknown model: ${this.#modelName}`);
    }
  }

  embeddingDataType(): Float {
    return new Float32();
  }

  async computeSourceEmbeddings(data: string[]): Promise<number[][]> {
    const response = await this.#.embeddings.create({
      model: this.#modelName,
      input: data,
    });

    const embeddings: number[][] = [];
    for (let i = 0; i < response.data.length; i++) {
      embeddings.push(response.data[i].embedding);
    }
    return embeddings;
  }

  async computeQueryEmbeddings(data: string): Promise<number[]> {
    if (typeof data !== "string") {
      throw new Error("Data must be a string");
    }
    const response = await this.#.embeddings.create({
      model: this.#modelName,
      input: data,
    });

    return response.data[0].embedding;
  }
}
