import { DatabaseSync } from "node:sqlite";

class LocalStatement {
  constructor(database, sql, parameters = []) {
    this.database = database;
    this.sql = sql;
    this.parameters = parameters;
  }

  bind(...parameters) {
    return new LocalStatement(this.database, this.sql, parameters);
  }

  run() {
    return this.database.prepare(this.sql).run(...this.parameters);
  }

  first() {
    return this.database.prepare(this.sql).get(...this.parameters) || null;
  }

  all() {
    return { results: this.database.prepare(this.sql).all(...this.parameters) };
  }
}

export function createLocalD1() {
  const database = new DatabaseSync(":memory:");
  database.exec("PRAGMA foreign_keys = ON");
  return {
    prepare(sql) { return new LocalStatement(database, sql); },
    async batch(statements) { return statements.map((statement) => statement.run()); },
  };
}
