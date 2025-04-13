/**
 * Migration script to add questionCount to all quizzes in Firestore.
 * Usage: node database/migrations/add_question_count_to_quizzes.js
 * (Requires "type": "module" in package.json)
 */

import admin from "firebase-admin";
import { readFile } from "fs/promises";

const serviceAccount = JSON.parse(
  await readFile(
    new URL("./serviceAccountKey.json", import.meta.url)
  )
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function addQuestionCountToQuizzes() {
  const quizzesSnapshot = await db.collection("quizzes").get();
  console.log(`Found ${quizzesSnapshot.size} quizzes.`);

  for (const quizDoc of quizzesSnapshot.docs) {
    const questionsSnapshot = await db
      .collection("quizzes")
      .doc(quizDoc.id)
      .collection("questions")
      .get();
    const questionCount = questionsSnapshot.size;

    await db.collection("quizzes").doc(quizDoc.id).update({
      questionCount,
    });

    console.log(
      `Updated quiz ${quizDoc.id} with questionCount: ${questionCount}`
    );
  }

  console.log("Migration complete.");
}

addQuestionCountToQuizzes().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});