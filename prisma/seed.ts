import {
  PrismaClient,
  PartyType,
  BalanceType,
  CommodityUnit,
  Direction,
  EntryType,
  PaymentMode,
  PaymentDirection,
  Role,
} from "@prisma/client";
import Decimal from "decimal.js";

const prisma = new PrismaClient();

const SEED_USER_ID = "00000000-0000-0000-0000-000000000001";

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.ledgerEntry.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.commodity.deleteMany();
  await prisma.party.deleteMany();
  await prisma.munimInvite.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.firm.deleteMany();

  const firm = await prisma.firm.create({
    data: {
      name: "Sharma Adat Agency",
      mandiName: "Azadpur Mandi",
      ownerName: "Ramesh Sharma",
      phone: "9876543210",
      address: "Gate No. 3, Azadpur, Delhi",
      defaultCommissionRate: 2,
    },
  });

  await prisma.profile.create({
    data: {
      userId: SEED_USER_ID,
      firmId: firm.id,
      fullName: "Ramesh Sharma",
      phone: "9876543210",
      role: Role.OWNER,
    },
  });

  const kisan1 = await prisma.party.create({
    data: {
      firmId: firm.id,
      type: PartyType.KISAN,
      name: "Suresh Kumar",
      phone: "9812345678",
      village: "Sonepat",
      openingBalance: 500,
      balanceType: BalanceType.PAYABLE,
    },
  });

  const kisan2 = await prisma.party.create({
    data: {
      firmId: firm.id,
      type: PartyType.KISAN,
      name: "Ram Pal Singh",
      phone: "9898989898",
      village: "Panipat",
      openingBalance: 0,
      balanceType: BalanceType.NONE,
    },
  });

  const vyapari1 = await prisma.party.create({
    data: {
      firmId: firm.id,
      type: PartyType.VYAPARI,
      name: "Gupta Traders",
      phone: "9123456789",
      village: "Delhi",
      openingBalance: 1000,
      balanceType: BalanceType.RECEIVABLE,
    },
  });

  const vyapari2 = await prisma.party.create({
    data: {
      firmId: firm.id,
      type: PartyType.VYAPARI,
      name: "Malik Commission",
      phone: "9234567890",
      village: "Ghaziabad",
      openingBalance: 0,
      balanceType: BalanceType.NONE,
    },
  });

  const aloo = await prisma.commodity.create({
    data: { firmId: firm.id, name: "Aloo", unit: CommodityUnit.QUINTAL },
  });

  const pyaz = await prisma.commodity.create({
    data: { firmId: firm.id, name: "Pyaz", unit: CommodityUnit.KG },
  });

  const tamatar = await prisma.commodity.create({
    data: { firmId: firm.id, name: "Tamatar", unit: CommodityUnit.BAG },
  });

  const txDate = new Date();
  txDate.setHours(0, 0, 0, 0);

  const transactions = [
    {
      farmerId: kisan1.id,
      traderId: vyapari1.id,
      commodityId: aloo.id,
      weight: 50,
      rate: 1200,
      commissionRate: 2,
      deductions: 100,
    },
    {
      farmerId: kisan2.id,
      traderId: vyapari2.id,
      commodityId: pyaz.id,
      weight: 200,
      rate: 35,
      commissionRate: 2,
      deductions: 0,
    },
    {
      farmerId: kisan1.id,
      traderId: vyapari1.id,
      commodityId: tamatar.id,
      weight: 30,
      rate: 800,
      commissionRate: 2,
      deductions: 50,
    },
  ];

  for (const t of transactions) {
    const weight = new Decimal(t.weight);
    const rate = new Decimal(t.rate);
    const gross = weight.mul(rate).toDecimalPlaces(2);
    const commission = gross.mul(t.commissionRate).div(100).toDecimalPlaces(2);
    const deductions = new Decimal(t.deductions);
    const farmerPayable = gross.minus(commission).minus(deductions).toDecimalPlaces(2);
    const traderReceivable = gross.toDecimalPlaces(2);

    const txn = await prisma.transaction.create({
      data: {
        firmId: firm.id,
        farmerId: t.farmerId,
        traderId: t.traderId,
        commodityId: t.commodityId,
        transactionDate: txDate,
        weight: weight.toNumber(),
        rate: rate.toNumber(),
        grossAmount: gross.toNumber(),
        commissionRate: t.commissionRate,
        commissionAmount: commission.toNumber(),
        deductions: deductions.toNumber(),
        farmerPayable: farmerPayable.toNumber(),
        traderReceivable: traderReceivable.toNumber(),
        createdBy: SEED_USER_ID,
      },
    });

    await prisma.ledgerEntry.createMany({
      data: [
        {
          firmId: firm.id,
          partyId: t.farmerId,
          transactionId: txn.id,
          entryDate: txDate,
          entryType: EntryType.TRANSACTION,
          direction: Direction.CREDIT,
          amount: farmerPayable.toNumber(),
          description: `Sale — farmer payable`,
        },
        {
          firmId: firm.id,
          partyId: t.traderId,
          transactionId: txn.id,
          entryDate: txDate,
          entryType: EntryType.TRANSACTION,
          direction: Direction.DEBIT,
          amount: traderReceivable.toNumber(),
          description: `Sale — trader receivable`,
        },
      ],
    });
  }

  const paymentToKisan = await prisma.payment.create({
    data: {
      firmId: firm.id,
      partyId: kisan1.id,
      paymentDate: txDate,
      amount: 5000,
      paymentMode: PaymentMode.UPI,
      direction: PaymentDirection.PAID,
      createdBy: SEED_USER_ID,
      notes: "Partial payment",
    },
  });

  await prisma.ledgerEntry.create({
    data: {
      firmId: firm.id,
      partyId: kisan1.id,
      paymentId: paymentToKisan.id,
      entryDate: txDate,
      entryType: EntryType.PAYMENT,
      direction: Direction.DEBIT,
      amount: 5000,
      description: "Payment to kisan",
    },
  });

  const paymentFromVyapari = await prisma.payment.create({
    data: {
      firmId: firm.id,
      partyId: vyapari1.id,
      paymentDate: txDate,
      amount: 10000,
      paymentMode: PaymentMode.CASH,
      direction: PaymentDirection.RECEIVED,
      createdBy: SEED_USER_ID,
    },
  });

  await prisma.ledgerEntry.create({
    data: {
      firmId: firm.id,
      partyId: vyapari1.id,
      paymentId: paymentFromVyapari.id,
      entryDate: txDate,
      entryType: EntryType.PAYMENT,
      direction: Direction.CREDIT,
      amount: 10000,
      description: "Payment from vyapari",
    },
  });

  console.log("Seed complete:", firm.name);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
