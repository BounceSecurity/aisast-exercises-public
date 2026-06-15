import Database from "better-sqlite3";
import { hashPassword } from "./auth";

export function seedDatabase(db: Database.Database): void {
  const insert = db.prepare(`
    INSERT INTO users (username, password_hash, role, mfa_enabled, secret_question_1, secret_answer_1, secret_question_2, secret_answer_2, email, balance)
    VALUES (@username, @password_hash, @role, @mfa_enabled, @secret_question_1, @secret_answer_1, @secret_question_2, @secret_answer_2, @email, @balance)
  `);

  const users = [
    {
      username: "admin",
      password_hash: hashPassword("admin123"),
      role: "admin",
      mfa_enabled: 0,
      secret_question_1: "What is the name of your least favorite child?",
      secret_answer_1: "Timmy",
      secret_question_2: "When did you stop trying?",
      secret_answer_2: "2015",
      email: "admin@example.com",
      balance: 100000,
    },
    {
      username: "alice",
      password_hash: hashPassword("alice1"),
      role: "customer",
      mfa_enabled: 1,
      secret_question_1: "What was the name of your favorite unpaid internship?",
      secret_answer_1: "Globex Corp",
      secret_question_2: "What is the name of your favorite canceled TV show?",
      secret_answer_2: "Firefly",
      email: "alice@example.com",
      balance: 100000,
    },
    {
      username: "bob",
      password_hash: hashPassword("password"),
      role: "customer",
      mfa_enabled: 0,
      secret_question_1: "In what year did you abandon your dreams?",
      secret_answer_1: "2020",
      secret_question_2: "On what street did you lose your childlike sense of wonder?",
      secret_answer_2: "Elm Street",
      email: "bob@example.com",
      balance: 100000,
    },
    {
      username: "charlie",
      password_hash: hashPassword("chuck1"),
      role: "customer",
      mfa_enabled: 1,
      secret_question_1: "What is the maiden name of your father's mistress?",
      secret_answer_1: "Johnson",
      secret_question_2: "At what age did your childhood pet run away?",
      secret_answer_2: "7",
      email: "charlie@example.com",
      balance: 100000,
    },
  ];

  const insertMany = db.transaction((items: typeof users) => {
    for (const user of items) {
      insert.run(user);
    }
  });

  insertMany(users);
}
