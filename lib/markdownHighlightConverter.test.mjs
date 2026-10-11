import test from "node:test";
import assert from "node:assert/strict";
import { legacyToRich, richToStorage } from "./markdownHighlightConverter.ts";

test("1. Converts rose highlight ==r:text==", () => {
    const input = "This is ==r:critical bug==";
    const rich = legacyToRich(input);
    assert.equal(rich, 'This is <mark data-color="#f43f5e">critical bug</mark>');
    assert.equal(richToStorage(rich), "This is ==r:critical bug==");
});

test("2. Converts emerald highlight ==g:text==", () => {
    const input = "Found an ==g:optimal insight==";
    const rich = legacyToRich(input);
    assert.equal(rich, 'Found an <mark data-color="#10b981">optimal insight</mark>');
    assert.equal(richToStorage(rich), "Found an ==g:optimal insight==");
});

test("3. Converts sky blue highlight ==b:text==", () => {
    const input = "Use ==b:std::vector== here";
    const rich = legacyToRich(input);
    assert.equal(rich, 'Use <mark data-color="#06b6d4">std::vector</mark> here');
    assert.equal(richToStorage(rich), "Use ==b:std::vector== here");
});

test("4. Converts amber highlight ==y:text==", () => {
    const input = "Note: ==y:interviewer follow-up==";
    const rich = legacyToRich(input);
    assert.equal(rich, 'Note: <mark data-color="#f59e0b">interviewer follow-up</mark>');
    assert.equal(richToStorage(rich), "Note: ==y:interviewer follow-up==");
});

test("5. Converts purple highlight ==p:text==", () => {
    const input = "Formula is ==p:dp[i] = dp[i-1] + dp[i-2]==";
    const rich = legacyToRich(input);
    assert.equal(rich, 'Formula is <mark data-color="#a855f7">dp[i] = dp[i-1] + dp[i-2]</mark>');
    assert.equal(richToStorage(rich), "Formula is ==p:dp[i] = dp[i-1] + dp[i-2]==");
});

test("6. Converts fallback highlight without color prefix ==text==", () => {
    const input = "Important: ==check edge cases==";
    const rich = legacyToRich(input);
    assert.equal(rich, 'Important: <mark data-color="#f59e0b">check edge cases</mark>');
    assert.equal(richToStorage(rich), "Important: ==y:check edge cases==");
});

test("7. Converts full color names ==red:==, ==green:==, ==blue:==, ==purple:==", () => {
    assert.equal(legacyToRich("==red:bug=="), '<mark data-color="#f43f5e">bug</mark>');
    assert.equal(legacyToRich("==green:win=="), '<mark data-color="#10b981">win</mark>');
    assert.equal(legacyToRich("==blue:lib=="), '<mark data-color="#06b6d4">lib</mark>');
    assert.equal(legacyToRich("==purple:math=="), '<mark data-color="#a855f7">math</mark>');
});

test("8. Handles multiple highlights on a single line", () => {
    const input = "Check ==r:bug== and also ==g:optimal solution== here.";
    const rich = legacyToRich(input);
    assert.equal(rich, 'Check <mark data-color="#f43f5e">bug</mark> and also <mark data-color="#10b981">optimal solution</mark> here.');
    assert.equal(richToStorage(rich), input);
});

test("9. Handles nested formatting inside a highlight", () => {
    const input = "==r:Warning: **do not** mutate `arr` directly==";
    const rich = legacyToRich(input);
    assert.equal(rich, '<mark data-color="#f43f5e">Warning: **do not** mutate `arr` directly</mark>');
    assert.equal(richToStorage(rich), input);
});

test("10. Handles highlights wrapped in bold formatting", () => {
    const input = "**==b:Standard Algorithm==**";
    const rich = legacyToRich(input);
    assert.equal(rich, '**<mark data-color="#06b6d4">Standard Algorithm</mark>**');
    assert.equal(richToStorage(rich), input);
});

test("11. Protects code blocks from highlight conversion", () => {
    const input = "```typescript\nconst bug = \"==r:critical==\";\nreturn bug;\n```";
    const rich = legacyToRich(input);
    assert.equal(rich, input);
    assert.equal(richToStorage(rich), input);
});

test("12. Protects inline code from highlight conversion", () => {
    const input = "Run `console.log('==g:test==')` to verify.";
    const rich = legacyToRich(input);
    assert.equal(rich, input);
    assert.equal(richToStorage(rich), input);
});

test("13. Protects Mermaid diagram code blocks", () => {
    const input = "```mermaid\ngraph TD\nA[==r:Root Node==] --> B[==g:Child Node==]\n```";
    const rich = legacyToRich(input);
    assert.equal(rich, input);
    assert.equal(richToStorage(rich), input);
});

test("14. Leaves unclosed == untouched", () => {
    const input = "This is ==r:unclosed highlight that ends abruptly";
    const rich = legacyToRich(input);
    assert.equal(rich, input);
});

test("15. Leaves empty highlights untouched", () => {
    assert.equal(legacyToRich("===="), "====");
    assert.equal(legacyToRich("==r:=="), "==r:==");
    assert.equal(legacyToRich("==   =="), "==   ==");
});

test("16. Handles uppercase prefix case-insensitively", () => {
    const input = "==R:critical bug==";
    const rich = legacyToRich(input);
    assert.equal(rich, '<mark data-color="#f43f5e">critical bug</mark>');
    assert.equal(richToStorage(rich), "==r:critical bug==");
});

test("17. Complete round-trip preserves multiline markdown document", () => {
    const doc = [
        "# Complex Note",
        "",
        "First point: ==r:critical bug==.",
        "Second point: ==g:optimal approach==.",
        "",
        "```python",
        "def solve():",
        "    return '==b:untouched=='",
        "```",
        "",
        "- Bullet with `code` and ==y:follow up note==",
        "- Next with ==p:formula x^2==",
    ].join("\n");

    const rich = legacyToRich(doc);
    assert.ok(!rich.includes("==r:"));
    assert.ok(!rich.includes("==g:"));
    assert.ok(!rich.includes("==y:"));
    assert.ok(!rich.includes("==p:"));
    assert.ok(rich.includes('<mark data-color="#f43f5e">critical bug</mark>'));
    assert.ok(rich.includes("'==b:untouched=='")); // preserved in code block

    const restored = richToStorage(rich);
    assert.equal(restored, doc);
});
