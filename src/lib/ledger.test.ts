import test from "node:test";
import assert from "node:assert/strict";
import { calcBalance, settleUpTx, buildTimeline, balanceDirection } from "./ledger";

test("calcBalance - friend owes me", () => {
  const result = calcBalance([
    { direction: "I_GAVE", amount: 1500, settled: false },
    { direction: "THEY_REPAID", amount: 500, settled: false },
  ]);

  assert.equal(result.owedToMe, 1000);
  assert.equal(result.iOwe, 0);
  assert.equal(result.net, 1000);
  assert.equal(result.timesGave, 1);
  assert.equal(result.totalGiven, 1500);
  assert.equal(result.totalTheyRepaid, 500);
  assert.equal(balanceDirection(result.net), "owed-to-me");
});

test("calcBalance - I owe friend", () => {
  const result = calcBalance([
    { direction: "I_BORROWED", amount: 2000, settled: false },
    { direction: "I_REPAID", amount: 800, settled: false },
  ]);

  assert.equal(result.owedToMe, 0);
  assert.equal(result.iOwe, 1200);
  assert.equal(result.net, -1200);
  assert.equal(result.timesBorrowed, 1);
  assert.equal(result.totalBorrowed, 2000);
  assert.equal(result.totalIRepaid, 800);
  assert.equal(balanceDirection(result.net), "i-owe");
});

test("calcBalance - complex multi-transaction balance", () => {
  const result = calcBalance([
    { direction: "I_GAVE", amount: 3000, settled: false },
    { direction: "I_BORROWED", amount: 1000, settled: false },
    { direction: "THEY_REPAID", amount: 1000, settled: false },
    { direction: "I_REPAID", amount: 500, settled: false },
  ]);

  // owedToMe = 3000 - 1000 = 2000
  // iOwe = 1000 - 500 = 500
  // net = 2000 - 500 = 1500
  assert.equal(result.owedToMe, 2000);
  assert.equal(result.iOwe, 500);
  assert.equal(result.net, 1500);
  assert.equal(result.timesGave, 1);
  assert.equal(result.timesBorrowed, 1);
});

test("settleUpTx - produces balancing transaction", () => {
  const friendOwesMe = calcBalance([
    { direction: "I_GAVE", amount: 2500, settled: false },
  ]);
  const settle1 = settleUpTx(friendOwesMe);
  assert.deepEqual(settle1, { amount: 2500, direction: "THEY_REPAID" });

  const iOweFriend = calcBalance([
    { direction: "I_BORROWED", amount: 1800, settled: false },
  ]);
  const settle2 = settleUpTx(iOweFriend);
  assert.deepEqual(settle2, { amount: 1800, direction: "I_REPAID" });
});

test("buildTimeline - computes accurate running balances chronologically", () => {
  const timeline = buildTimeline([
    { direction: "I_GAVE", amount: 1000, settled: false, date: "2026-01-01" },
    { direction: "I_GAVE", amount: 500, settled: false, date: "2026-01-03" },
    { direction: "THEY_REPAID", amount: 300, settled: false, date: "2026-01-05" },
    { direction: "I_BORROWED", amount: 400, settled: false, date: "2026-01-07" },
  ]);

  assert.equal(timeline[0].runningBalance, 1000);
  assert.equal(timeline[1].runningBalance, 1500);
  assert.equal(timeline[2].runningBalance, 1200);
  assert.equal(timeline[3].runningBalance, 800);
});
