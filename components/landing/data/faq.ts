export type FaqItem = {
  question: string;
  answer: string;
};

// Answers describe what the product actually does today. Anything aspirational
// is labelled as such — a prospect who tries the demo should never catch the
// marketing copy in a lie.
export const faqItems: FaqItem[] = [
  {
    question: 'Is my student data private?',
    answer:
      "Yes. Every table is protected by row-level security in Postgres, so a teacher only ever reads their own students' rows and a student only their own — enforced by the database, not just the UI. Your data isn't sold or used to train AI models.",
  },
  {
    question: 'Can I import my existing notes?',
    answer:
      'You can bulk-import your song library from a CSV, and pull your existing schedule straight in from Google Calendar — matching students by email and creating placeholders for the rest. Students and lesson notes are added as you go.',
  },
  {
    question: 'Do my students need an account?',
    answer:
      "Yes — each student gets their own login and a private portal showing their lessons, assigned songs, repertoire and practice log. That's what lets them log practice and mark assignments complete, so their progress flows back to you automatically.",
  },
  {
    question: 'What if I only teach a few students?',
    answer:
      "Strummy is built for the independent teacher — it works the same whether you have three students or thirty. It's currently free while in active development with a small group of real studios.",
  },
  {
    question: 'How do I get help or report a bug?',
    answer:
      'Strummy is developed in the open — you can read the source, file an issue, or follow along on GitHub. It is actively maintained, and bug reports from real teaching studios drive what gets built next.',
  },
];
