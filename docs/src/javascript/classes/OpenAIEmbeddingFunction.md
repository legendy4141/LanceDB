[vectordb](../README.md) / [Exports](../modules.md) / EmbeddingFunction

# Class: EmbeddingFunction

An embedding function that automatically creates vector representation for a given column.

## Implements

- [`EmbeddingFunction`](../interfaces/EmbeddingFunction.md)\<`string`\>

## Table of contents

### Constructors

- [constructor](EmbeddingFunction.md#constructor)

### Properties

- [\_modelName](EmbeddingFunction.md#_modelname)
- [\_](EmbeddingFunction.md#_)
- [sourceColumn](EmbeddingFunction.md#sourcecolumn)

### Methods

- [embed](EmbeddingFunction.md#embed)

## Constructors

### constructor

• **new EmbeddingFunction**(`sourceColumn`, `Key`, `modelName?`)

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `sourceColumn` | `string` | `undefined` |
| `Key` | `string` | `undefined` |
| `modelName` | `string` | `'text-embedding-ada-002'` |

#### Defined in

[embedding/.ts:22](https://github.com/lancedb/lancedb/blob/92179835/node/src/embedding/.ts#L22)

## Properties

### \_modelName

• `Private` `Readonly` **\_modelName**: `string`

#### Defined in

[embedding/.ts:20](https://github.com/lancedb/lancedb/blob/92179835/node/src/embedding/.ts#L20)

___

### \_

• `Private` `Readonly` **\_**: ``

#### Defined in

[embedding/.ts:19](https://github.com/lancedb/lancedb/blob/92179835/node/src/embedding/.ts#L19)

___

### sourceColumn

• **sourceColumn**: `string`

The name of the column that will be used as input for the Embedding Function.

#### Implementation of

[EmbeddingFunction](../interfaces/EmbeddingFunction.md).[sourceColumn](../interfaces/EmbeddingFunction.md#sourcecolumn)

#### Defined in

[embedding/.ts:56](https://github.com/lancedb/lancedb/blob/92179835/node/src/embedding/.ts#L56)

## Methods

### embed

▸ **embed**(`data`): `Promise`\<`number`[][]\>

Creates a vector representation for the given values.

#### Parameters

| Name | Type |
| :------ | :------ |
| `data` | `string`[] |

#### Returns

`Promise`\<`number`[][]\>

#### Implementation of

[EmbeddingFunction](../interfaces/EmbeddingFunction.md).[embed](../interfaces/EmbeddingFunction.md#embed)

#### Defined in

[embedding/.ts:43](https://github.com/lancedb/lancedb/blob/92179835/node/src/embedding/.ts#L43)
