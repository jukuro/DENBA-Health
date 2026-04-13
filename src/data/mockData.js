export const agentData = {
  id: "AGT-10024",
  name: "田中 健一郎",
  status: "紹介型",
  totalSales: 4,
  currentTier: 25,
  thisMonthSales: 2,
  thisMonthCommission: 138600,
  referralLink: "https://denba-health.jp/ref/AGT-10024",
  joinDate: "2026-01-15"
};

export const adminData = {
  totalAgents: 45,
  monthlySales: 15,
  pendingApprovals: 3,
  monthlyRevenue: 5940000,
  monthlyPayouts: 1188000
};

export const agentListMock = [
  { id: "AGT-10024", name: "田中 健一郎", type: "紹介型", totalSales: 4, monthSales: 2, tier: 25 },
  { id: "AGT-10025", name: "鈴木 美咲", type: "卸型", totalSales: 12, monthSales: 5, tier: null },
  { id: "AGT-10026", name: "佐藤 一郎", type: "紹介型", totalSales: 1, monthSales: 1, tier: 10 },
  { id: "AGT-10027", name: "高橋 誠", type: "紹介型", totalSales: 0, monthSales: 0, tier: 10 },
  { id: "AGT-10028", name: "伊藤 直美", type: "紹介型", totalSales: 2, monthSales: 0, tier: 20 },
];

export const agentSalesHistoryMock = [
  { id: "ORD-00100", date: "2026-04-12", customer: "山本 様", status: "納品完了", commission: 99000, note: "通常販売 (3台目・25%)" },
  { id: "ORD-00085", date: "2026-04-05", customer: "渡辺 様", status: "入金確認中", commission: 39600, note: "通常販売" },
  { id: "ORD-00042", date: "2026-02-18", customer: "木村 様", status: "完了", commission: 79200, note: "通常販売 (2台目・20%)" },
  { id: "ORD-00015", date: "2026-01-20", customer: "小林 様", status: "完了", commission: 39600, note: "初回販売 (10%)" },
];

export const adminPayoutsMock = [
  { reqId: "PAY-04001", agentId: "AGT-10024", agentName: "田中 健一郎", bank: "三井住友銀行", branch: "新宿支店", account: "普通 1234567", amount: 138600, details: "販売2台(10%+25%)", status: "未振込" },
  { reqId: "PAY-04002", agentId: "AGT-10025", agentName: "鈴木 美咲", bank: "三菱UFJ銀行", branch: "本店", account: "普通 9876543", amount: 480000, details: "卸売差益(9.6万×5台)", status: "未振込" },
  { reqId: "PAY-04003", agentId: "AGT-10026", agentName: "佐藤 一郎", bank: "PayPay銀行", branch: "すずめ支店", account: "普通 5555555", amount: 39600, details: "初回販売(10%)", status: "未振込" },
  { reqId: "PAY-04004", agentId: "AGT-10010", agentName: "山田 太郎", bank: "楽天銀行", branch: "ジャズ支店", account: "普通 1111111", amount: 19800, details: "紹介者報酬(5%) - 佐藤一郎の初回販売分", status: "未振込" },
];
