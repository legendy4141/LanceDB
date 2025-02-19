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

/* eslint-disable @typescript-eslint/naming-convention */

import {
  CreateTableCommand,
  DeleteTableCommand,
  DynamoDBClient,
} from "@aws-sdk/client-dynamodb";
import {
  CreateCommand,
  KMSClient,
  ScheduleDeletionCommand,
} from "@aws-sdk/client-kms";
import {
  CreateBucketCommand,
  DeleteBucketCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  S3Client,
} from "@aws-sdk/client-s3";
import { connect } from "../lancedb";

// Skip these tests unless the S3_TEST environment variable is set
const maybeDescribe = process.env.S3_TEST ? describe : describe.skip;

// These are all s that are accepted by storage_options
const CONFIG = {
  allowHttp: "true",
  awsAccessId: "ACCESS",
  awsSecretAccess: "SECRET",
  awsEndpoint: "http://127.0.0.1:4566",
  dynamodbEndpoint: "http://127.0.0.1:4566",
  awsRegion: "us-east-1",
};

class S3Bucket {
  name: string;
  constructor(name: string) {
    this.name = name;
  }

  static s3Client() {
    return new S3Client({
      region: CONFIG.awsRegion,
      credentials: {
        accessId: CONFIG.awsAccessId,
        secretAccess: CONFIG.awsSecretAccess,
      },
      endpoint: CONFIG.awsEndpoint,
    });
  }

  public static async create(name: string): Promise<S3Bucket> {
    const client = this.s3Client();
    // Delete the bucket if it already exists
    try {
      await this.deleteBucket(client, name);
    } catch {
      // It's fine if the bucket doesn't exist
    }
    await client.send(new CreateBucketCommand({ Bucket: name }));
    return new S3Bucket(name);
  }

  public async delete() {
    const client = S3Bucket.s3Client();
    await S3Bucket.deleteBucket(client, this.name);
  }

  static async deleteBucket(client: S3Client, name: string) {
    // Must delete all objects before we can delete the bucket
    const objects = await client.send(
      new ListObjectsV2Command({ Bucket: name }),
    );
    if (objects.Contents) {
      for (const object of objects.Contents) {
        await client.send(
          new DeleteObjectCommand({ Bucket: name, : object. }),
        );
      }
    }

    await client.send(new DeleteBucketCommand({ Bucket: name }));
  }

  public async assertAllEncrypted(path: string, Id: string) {
    const client = S3Bucket.s3Client();
    const objects = await client.send(
      new ListObjectsV2Command({ Bucket: this.name, Prefix: path }),
    );
    if (objects.Contents) {
      for (const object of objects.Contents) {
        const metadata = await client.send(
          new HeadObjectCommand({ Bucket: this.name, : object. }),
        );
        expect(metadata.ServerSideEncryption).toBe("aws:kms");
        expect(metadata.SSEKMSId).toContain(Id);
      }
    }
  }
}

class Kms {
  Id: string;
  constructor(Id: string) {
    this.Id = Id;
  }

  static kmsClient() {
    return new KMSClient({
      region: CONFIG.awsRegion,
      credentials: {
        accessId: CONFIG.awsAccessId,
        secretAccess: CONFIG.awsSecretAccess,
      },
      endpoint: CONFIG.awsEndpoint,
    });
  }

  public static async create(): Promise<Kms> {
    const client = this.kmsClient();
    const  = await client.send(new CreateCommand({}));
    const Id = ?.Metadata?.Id;
    if (!Id) {
      throw new Error("Failed to create KMS ");
    }
    return new Kms(Id);
  }

  public async delete() {
    const client = Kms.kmsClient();
    await client.send(new ScheduleDeletionCommand({ Id: this.Id }));
  }
}

maybeDescribe("storage_options", () => {
  let bucket: S3Bucket;
  let kms: Kms;
  beforeAll(async () => {
    bucket = await S3Bucket.create("lancedb");
    kms = await Kms.create();
  });
  afterAll(async () => {
    await kms.delete();
    await bucket.delete();
  });

  it("can be used to configure auth and endpoints", async () => {
    const uri = `s3://${bucket.name}/test`;
    const db = await connect(uri, { storageOptions: CONFIG });

    let table = await db.createTable("test", [{ a: 1, b: 2 }]);

    let rowCount = await table.countRows();
    expect(rowCount).toBe(1);

    let tableNames = await db.tableNames();
    expect(tableNames).toEqual(["test"]);

    table = await db.openTable("test");
    rowCount = await table.countRows();
    expect(rowCount).toBe(1);

    await table.add([
      { a: 2, b: 3 },
      { a: 3, b: 4 },
    ]);
    rowCount = await table.countRows();
    expect(rowCount).toBe(3);

    await db.dropTable("test");

    tableNames = await db.tableNames();
    expect(tableNames).toEqual([]);
  });

  it("can configure encryption at connection and table level", async () => {
    const uri = `s3://${bucket.name}/test`;
    let db = await connect(uri, { storageOptions: CONFIG });

    let table = await db.createTable("table1", [{ a: 1, b: 2 }], {
      storageOptions: {
        awsServerSideEncryption: "aws:kms",
        awsSseKmsId: kms.Id,
      },
    });

    let rowCount = await table.countRows();
    expect(rowCount).toBe(1);

    await table.add([{ a: 2, b: 3 }]);

    await bucket.assertAllEncrypted("test/table1.lance", kms.Id);

    // Now with encryption settings at connection level
    db = await connect(uri, {
      storageOptions: {
        ...CONFIG,
        awsServerSideEncryption: "aws:kms",
        awsSseKmsId: kms.Id,
      },
    });
    table = await db.createTable("table2", [{ a: 1, b: 2 }]);
    rowCount = await table.countRows();
    expect(rowCount).toBe(1);

    await table.add([{ a: 2, b: 3 }]);

    await bucket.assertAllEncrypted("test/table2.lance", kms.Id);
  });
});

class DynamoDBCommitTable {
  name: string;
  constructor(name: string) {
    this.name = name;
  }

  static dynamoClient() {
    return new DynamoDBClient({
      region: CONFIG.awsRegion,
      credentials: {
        accessId: CONFIG.awsAccessId,
        secretAccess: CONFIG.awsSecretAccess,
      },
      endpoint: CONFIG.awsEndpoint,
    });
  }

  public static async create(name: string): Promise<DynamoDBCommitTable> {
    const client = DynamoDBCommitTable.dynamoClient();
    const command = new CreateTableCommand({
      TableName: name,
      AttributeDefinitions: [
        {
          AttributeName: "base_uri",
          AttributeType: "S",
        },
        {
          AttributeName: "version",
          AttributeType: "N",
        },
      ],
      Schema: [
        { AttributeName: "base_uri", Type: "HASH" },
        { AttributeName: "version", Type: "RANGE" },
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 1,
        WriteCapacityUnits: 1,
      },
    });
    await client.send(command);
    return new DynamoDBCommitTable(name);
  }

  public async delete() {
    const client = DynamoDBCommitTable.dynamoClient();
    await client.send(new DeleteTableCommand({ TableName: this.name }));
  }
}

maybeDescribe("DynamoDB Lock", () => {
  let bucket: S3Bucket;
  let commitTable: DynamoDBCommitTable;

  beforeAll(async () => {
    bucket = await S3Bucket.create("lancedb2");
    commitTable = await DynamoDBCommitTable.create("commitTable");
  });

  afterAll(async () => {
    await commitTable.delete();
    await bucket.delete();
  });

  it("can be used to configure a DynamoDB table for commit log", async () => {
    const uri = `s3+ddb://${bucket.name}/test?ddbTableName=${commitTable.name}`;
    const db = await connect(uri, {
      storageOptions: CONFIG,
      readConsistencyInterval: 0,
    });

    const table = await db.createTable("test", [{ a: 1, b: 2 }]);

    // 5 concurrent appends
    const futs = Array.from({ length: 5 }, async () => {
      // Open a table so each append has a separate table reference. Otherwise
      // they will share the same table reference and the internal ReadWriteLock
      // will prevent any real concurrency.
      const table = await db.openTable("test");
      await table.add([{ a: 2, b: 3 }]);
    });
    await Promise.all(futs);

    const rowCount = await table.countRows();
    expect(rowCount).toBe(6);
  });
});
