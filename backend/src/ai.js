import fallbackQuestions from "./question.js";

export async function generateQuestion(index) {

  // ===============================
  // CODING QUESTIONS (0,1)
  // ===============================
  if (index === 0 || index === 1) {
    const q = fallbackQuestions[index];

    return {
      title: q.title,
      description: q.description,
      input: q.input,
      output: q.output,
      difficulty: q.difficulty,
      type: "coding"
    };
  }

  // ===============================
  // DEBUGGING QUESTIONS (2,3)
  // ===============================
  const debugQuestions = [
    {
      title: "Fix Fibonacci Code",
      description:
        "The code below should calculate the nth Fibonacci number. It contains a logical bug. Identify and fix it.",
      type: "debug",

      // 🔥 MUST BE buggyCode (NOT starterCode)
      buggyCode: `def fib(n):
    if n == 0:
        return 0
    if n == 1:
        return 1

    # ❌ BUG: second recursive call is wrong
    return fib(n-1) + fib(n-1)

print(fib(6))`
    },
    {
      title: "Fix Palindrome Checker",
      description:
        "The function below should check whether a string is a palindrome. There is a logical error. Identify and fix it.",
      type: "debug",

      // 🔥 MUST BE buggyCode
      buggyCode: `def is_palindrome(s):
    l = 0
    r = len(s) - 1

    while l < r:
        # ❌ BUG: condition is incorrect
        if s[l] == s[r]:
            return False
        l += 1
        r -= 1

    return True

print(is_palindrome("madam"))`
    }
  ];

  return debugQuestions[index - 2];
}

export async function finalReview() {
  return "Evaluation completed successfully.";
}
